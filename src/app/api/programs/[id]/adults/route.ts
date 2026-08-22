import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { withTurnstileProtection } from '@/lib/turnstile';
import { isAdult, MIN_ADULT_AGE } from '@/lib/age-classification';
import {
  parseHealthFields,
  uploadEnrollmentFiles,
  upsertHealthProfile,
  getOrCreateMember,
  formString,
  GUARDIAN_RELATIONSHIPS,
} from '@/lib/program-enrollment';

// POST /api/programs/[id]/adults - Register a co-responsible adult
// (e.g. the other parent) from an enrolled adult's dashboard. Health data is
// optional here: the co-adult completes it later entering with their own
// document; the admin checklist flags what is missing. The new adult is
// linked as guardian (with the given relationship) to every child of the
// registrant's group.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: programIdParam } = await params;

  return withTurnstileProtection(
    request,
    async (req) => {
      const { env } = getCloudflareContext();

      try {
        const programId = parseInt(programIdParam);
        if (isNaN(programId)) {
          return NextResponse.json({ error: 'Programa inválido' }, { status: 400 });
        }

        const form = await req.formData();
        const registrantDocumentID = formString(form, 'tutorDocumentID');
        const documentID = formString(form, 'documentID');
        const name = formString(form, 'name');
        const phone = formString(form, 'phone');
        const birthDate = formString(form, 'birthDate');
        const gender = formString(form, 'gender');
        const relationship = formString(form, 'relationship');

        if (
          !registrantDocumentID ||
          !documentID ||
          !name ||
          !phone ||
          !birthDate ||
          !relationship
        ) {
          return NextResponse.json(
            {
              error:
                'Documento del registrante, documento, nombre, teléfono, fecha de nacimiento y parentesco son requeridos',
            },
            { status: 400 }
          );
        }
        if (!GUARDIAN_RELATIONSHIPS.includes(relationship)) {
          return NextResponse.json({ error: 'Parentesco inválido' }, { status: 400 });
        }
        if (!isAdult(birthDate)) {
          return NextResponse.json(
            { error: `El responsable debe tener al menos ${MIN_ADULT_AGE} años` },
            { status: 400 }
          );
        }

        const registrant = await env.DB.prepare(
          `SELECT m.id as memberId FROM Member m
           JOIN ProgramAdultEnrollment pae ON pae.memberId = m.id AND pae.programId = ?
           WHERE m.documentID = ?`
        )
          .bind(programId, registrantDocumentID)
          .first<{ memberId: number }>();

        if (!registrant) {
          return NextResponse.json(
            { error: 'El registrante no está inscrito en el programa' },
            { status: 403 }
          );
        }

        const member = await getOrCreateMember(env.DB, {
          documentID,
          name,
          phone,
          birthDate,
          gender,
        });

        // Keep identity in sync on edit (getOrCreateMember only creates)
        await env.DB.prepare(
          'UPDATE Member SET name = ?, phone = ?, birthDate = ?, gender = ?, updatedAt = ? WHERE id = ?'
        )
          .bind(name, phone, birthDate, gender || null, new Date().toISOString(), member.id)
          .run();

        // Health is optional for co-adults; store it only when provided
        const health = parseHealthFields(form);
        const files = await uploadEnrollmentFiles(env.UPLOADS, form);
        if (!files.success) {
          return NextResponse.json({ error: files.error }, { status: 400 });
        }
        if (health.success) {
          await upsertHealthProfile(env.DB, { memberId: member.id }, health.data, files);
        }

        // Inherit the núcleo's emergency contact from the registrant
        const groupContact = await env.DB.prepare(
          `SELECT emergencyContactName, emergencyContactPhone, emergencyContactRelation
           FROM ProgramAdultEnrollment WHERE programId = ? AND memberId = ?`
        )
          .bind(programId, registrant.memberId)
          .first<{
            emergencyContactName: string | null;
            emergencyContactPhone: string | null;
            emergencyContactRelation: string | null;
          }>();

        const now = new Date().toISOString();
        await env.DB.prepare(
          `INSERT INTO ProgramAdultEnrollment
           (programId, memberId, relationship, emergencyContactName, emergencyContactPhone,
            emergencyContactRelation, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(programId, memberId) DO UPDATE SET relationship = excluded.relationship, updatedAt = excluded.updatedAt`
        )
          .bind(
            programId,
            member.id,
            relationship,
            groupContact?.emergencyContactName ?? null,
            groupContact?.emergencyContactPhone ?? null,
            groupContact?.emergencyContactRelation ?? null,
            now,
            now
          )
          .run();

        // Link the co-adult to every child of the registrant's group
        const children = await env.DB.prepare(
          `SELECT DISTINCT c.id FROM Child c
           JOIN Enrollment e ON e.childId = c.id AND e.programId = ?
           LEFT JOIN ChildGuardian cg ON cg.childId = c.id AND cg.memberId = ?
           WHERE cg.memberId IS NOT NULL OR e.enrolledByMemberId = ?`
        )
          .bind(programId, registrant.memberId, registrant.memberId)
          .all<{ id: number }>();

        for (const child of children.results || []) {
          // Drop this member's prior link to the child so a changed
          // relationship (e.g. father -> mother) doesn't leave a stale row
          await env.DB.prepare('DELETE FROM ChildGuardian WHERE childId = ? AND memberId = ?')
            .bind(child.id, member.id)
            .run();
          await env.DB.prepare(
            `INSERT INTO ChildGuardian (childId, memberId, relationship, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(childId, relationship) DO UPDATE SET memberId = excluded.memberId, updatedAt = excluded.updatedAt`
          )
            .bind(child.id, member.id, relationship, now, now)
            .run();
        }

        return NextResponse.json(
          {
            success: true,
            memberId: member.id,
            relationship,
            linkedChildren: children.results?.length || 0,
          },
          { status: 201 }
        );
      } catch (error) {
        console.error('Error registering co-adult:', error);
        return NextResponse.json({ error: 'Error al registrar al responsable' }, { status: 500 });
      }
    },
    { allowFormPass: true }
  );
}

// DELETE /api/programs/[id]/adults - Remove a co-responsible adult from
// the núcleo. The requester cannot remove themselves. Drops the target's
// program enrollment and their guardian links to the group's children; the
// Member record persists.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: programIdParam } = await params;

  return withTurnstileProtection(
    request,
    async (req) => {
      const { env } = getCloudflareContext();

      try {
        const programId = parseInt(programIdParam);
        if (isNaN(programId)) {
          return NextResponse.json({ error: 'Programa inválido' }, { status: 400 });
        }

        const body = (await req.json()) as { tutorDocumentID?: string; documentID?: string };
        if (!body.tutorDocumentID || !body.documentID) {
          return NextResponse.json(
            { error: 'Documento del solicitante y del responsable son requeridos' },
            { status: 400 }
          );
        }
        if (body.tutorDocumentID === body.documentID) {
          return NextResponse.json(
            { error: 'No puedes quitarte a ti mismo del núcleo' },
            { status: 400 }
          );
        }

        const requester = await env.DB.prepare(
          `SELECT m.id FROM Member m
           JOIN ProgramAdultEnrollment pae ON pae.memberId = m.id AND pae.programId = ?
           WHERE m.documentID = ?`
        )
          .bind(programId, body.tutorDocumentID)
          .first<{ id: number }>();

        if (!requester) {
          return NextResponse.json(
            { error: 'El solicitante no está inscrito en el programa' },
            { status: 403 }
          );
        }

        const target = await env.DB.prepare('SELECT id FROM Member WHERE documentID = ?')
          .bind(body.documentID)
          .first<{ id: number }>();
        if (!target) {
          return NextResponse.json({ error: 'Responsable no encontrado' }, { status: 404 });
        }

        // Only allow removing an adult who shares a child with the requester
        const removal = await env.DB.prepare(
          `DELETE FROM ProgramAdultEnrollment
           WHERE programId = ? AND memberId = ?
             AND memberId IN (
               SELECT cg2.memberId FROM ChildGuardian cg2
               JOIN ChildGuardian cg3 ON cg3.childId = cg2.childId
               WHERE cg3.memberId = ?
             )`
        )
          .bind(programId, target.id, requester.id)
          .run();

        if (removal.meta.changes === 0) {
          return NextResponse.json(
            { error: 'Responsable no pertenece a tu núcleo' },
            { status: 404 }
          );
        }

        // Drop the target's guardian links to this program's children
        await env.DB.prepare(
          `DELETE FROM ChildGuardian
           WHERE memberId = ?
             AND childId IN (SELECT childId FROM Enrollment WHERE programId = ?)`
        )
          .bind(target.id, programId)
          .run();

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error removing co-adult:', error);
        return NextResponse.json({ error: 'Error al quitar al responsable' }, { status: 500 });
      }
    },
    { allowFormPass: true }
  );
}
