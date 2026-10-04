import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { withTurnstileProtection } from '@/lib/turnstile';
import { classify } from '@/lib/age-classification';
import {
  parseHealthFields,
  uploadEnrollmentFiles,
  upsertHealthProfile,
  getOrCreateChild,
  formString,
  upsertChildGuardian,
  ANCHORED_FAMILY_ADULTS_SQL,
} from '@/lib/program-enrollment';

// POST /api/programs/[id]/children - Register a child into the program.
// Only a registered adult of the program can do it: children never enroll
// alone. Multipart: child + health fields, optional photo/idDocument.
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
        const tutorDocumentID = formString(form, 'tutorDocumentID');
        const documentID = formString(form, 'documentID');
        const name = formString(form, 'name');
        const gender = formString(form, 'gender');
        const birthDate = formString(form, 'birthDate');

        if (!tutorDocumentID || !documentID || !name || !birthDate) {
          return NextResponse.json(
            {
              error: 'Documento del tutor, documento, nombre y fecha de nacimiento son requeridos',
            },
            { status: 400 }
          );
        }

        // The registering adult must already be enrolled; the child inherits
        // the adult's relationship (father/mother/tutor).
        const tutor = await env.DB.prepare(
          `SELECT m.id as memberId, pae.relationship
           FROM Member m
           JOIN ProgramAdultEnrollment pae ON pae.memberId = m.id AND pae.programId = ?
           WHERE m.documentID = ?`
        )
          .bind(programId, tutorDocumentID)
          .first<{ memberId: number; relationship: string | null }>();

        if (!tutor) {
          return NextResponse.json(
            { error: 'El responsable no está inscrito en el programa' },
            { status: 403 }
          );
        }
        const relationship = tutor.relationship || 'tutor';

        const classification = classify(birthDate);
        if (classification.age >= 16) {
          return NextResponse.json(
            { error: 'Los mayores de 15 años se inscriben como responsables (Guía Mayor)' },
            { status: 400 }
          );
        }

        const health = parseHealthFields(form);
        if (!health.success) {
          return NextResponse.json({ error: health.error }, { status: 400 });
        }

        const files = await uploadEnrollmentFiles(env.UPLOADS, form);
        if (!files.success) {
          return NextResponse.json({ error: files.error }, { status: 400 });
        }

        // Capture the existing family before adding this child. All enrolled
        // co-responsibles must also be linked to children added later.
        const familyAdults = await env.DB.prepare(
          `
          SELECT DISTINCT pae.memberId, pae.relationship
          FROM ProgramAdultEnrollment pae
          WHERE pae.programId = ? AND (pae.memberId = ? OR pae.memberId IN (
            SELECT other.memberId FROM ChildGuardian own
            JOIN ChildGuardian other ON other.childId = own.childId
            JOIN Enrollment e ON e.childId = own.childId AND e.programId = ?
            WHERE own.memberId = ?
          ) OR pae.memberId IN (${ANCHORED_FAMILY_ADULTS_SQL}))
        `
        )
          .bind(programId, tutor.memberId, programId, tutor.memberId, programId, tutor.memberId)
          .all<{ memberId: number; relationship: string | null }>();

        const childId = await getOrCreateChild(env.DB, { documentID, name, gender, birthDate });
        await upsertHealthProfile(env.DB, { childId }, health.data, files);

        const now = new Date().toISOString();
        await upsertChildGuardian(env.DB, childId, tutor.memberId, relationship, now);
        for (const coAdult of familyAdults.results || []) {
          if (coAdult.memberId === tutor.memberId) continue;
          await upsertChildGuardian(
            env.DB,
            childId,
            coAdult.memberId,
            coAdult.relationship || 'tutor',
            now
          );
        }

        const enrollment = await env.DB.prepare(
          'SELECT id FROM Enrollment WHERE programId = ? AND childId = ?'
        )
          .bind(programId, childId)
          .first();

        if (!enrollment) {
          await env.DB.prepare(
            `INSERT INTO Enrollment (programId, childId, enrolledByMemberId, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?)`
          )
            .bind(programId, childId, tutor.memberId, now, now)
            .run();
        }

        return NextResponse.json(
          { success: true, childId, classification, alreadyEnrolled: Boolean(enrollment) },
          { status: enrollment ? 200 : 201 }
        );
      } catch (error) {
        console.error('Error registering child:', error);
        return NextResponse.json({ error: 'Error al inscribir al niño' }, { status: 500 });
      }
    },
    { allowFormPass: true }
  );
}

// DELETE /api/programs/[id]/children - Remove a child from the program.
// Only a guardian (or the adult who registered them) can do it. The Child
// record and health profile persist: only the program enrollment is removed.
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
            { error: 'Documento del tutor y del niño son requeridos' },
            { status: 400 }
          );
        }

        const result = await env.DB.prepare(
          `DELETE FROM Enrollment
           WHERE programId = ?
             AND childId = (SELECT id FROM Child WHERE documentID = ?)
             AND (
               enrolledByMemberId = (SELECT id FROM Member WHERE documentID = ?)
               OR childId IN (
                 SELECT cg.childId FROM ChildGuardian cg
                 JOIN Member m ON m.id = cg.memberId
                 WHERE m.documentID = ?
               )
             )`
        )
          .bind(programId, body.documentID, body.tutorDocumentID, body.tutorDocumentID)
          .run();

        if (result.meta.changes === 0) {
          return NextResponse.json(
            { error: 'Inscripción no encontrada o sin permiso para retirarla' },
            { status: 404 }
          );
        }

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error removing child from program:', error);
        return NextResponse.json({ error: 'Error al retirar al niño' }, { status: 500 });
      }
    },
    { allowFormPass: true }
  );
}
