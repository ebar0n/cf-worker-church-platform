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
  type HealthFields,
} from '@/lib/program-enrollment';

// POST /api/programs/[id]/join - Adult registration for the program.
// Multipart: personal + health fields, relationship (father/mother/tutor),
// optional photo/idDocument files.
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

        const program = await env.DB.prepare('SELECT id FROM Program WHERE id = ? AND isActive = 1')
          .bind(programId)
          .first();
        if (!program) {
          return NextResponse.json({ error: 'Programa no encontrado' }, { status: 404 });
        }

        const form = await req.formData();
        const documentID = formString(form, 'documentID');
        const name = formString(form, 'name');
        const phone = formString(form, 'phone');
        const birthDate = formString(form, 'birthDate');
        const email = formString(form, 'email');
        const gender = formString(form, 'gender');
        const relationship = formString(form, 'relationship') || 'tutor';
        const acceptDataTreatment = form.get('acceptDataTreatment') === 'true';
        const confirmParticipation = form.get('confirmParticipation') === 'true';

        if (!GUARDIAN_RELATIONSHIPS.includes(relationship)) {
          return NextResponse.json({ error: 'Parentesco inválido' }, { status: 400 });
        }
        if (!documentID || !name || !phone || !birthDate) {
          return NextResponse.json(
            { error: 'Documento, nombre, teléfono y fecha de nacimiento son requeridos' },
            { status: 400 }
          );
        }
        if (!isAdult(birthDate)) {
          return NextResponse.json(
            { error: `El responsable debe tener al menos ${MIN_ADULT_AGE} años` },
            { status: 400 }
          );
        }

        // Health is optional at registration: the responsible can start with
        // basic identity and complete their health record + files later from
        // the dashboard. Validate only when any health field is provided.
        const providedHealth = ['bloodType', 'eps', 'allergies', 'conditions', 'medications'].some(
          (key) => formString(form, key)
        );
        let healthData: HealthFields | null = null;
        if (providedHealth) {
          const health = parseHealthFields(form);
          if (!health.success) {
            return NextResponse.json({ error: health.error }, { status: 400 });
          }
          healthData = health.data;
        }

        const hasFiles = ['photo', 'idDocument', 'epsCertificate'].some((key) => {
          const file = form.get(key);
          return file instanceof File && file.size > 0;
        });
        if (!healthData && hasFiles) {
          return NextResponse.json(
            { error: 'Completa tipo de sangre y EPS antes de adjuntar archivos' },
            { status: 400 }
          );
        }

        const files = await uploadEnrollmentFiles(env.UPLOADS, form);
        if (!files.success) {
          return NextResponse.json({ error: files.error }, { status: 400 });
        }

        const member = await getOrCreateMember(env.DB, {
          documentID,
          name,
          phone,
          birthDate,
          email,
          gender,
        });

        // Keep identity in sync on edit (getOrCreateMember only creates)
        await env.DB.prepare(
          'UPDATE Member SET name = ?, phone = ?, birthDate = ?, email = ?, gender = ?, updatedAt = ? WHERE id = ?'
        )
          .bind(
            name,
            phone,
            birthDate,
            email || null,
            gender || null,
            new Date().toISOString(),
            member.id
          )
          .run();

        // Only touch the health record when data was provided, so a minimal
        // initial registration doesn't create an empty profile.
        if (healthData) {
          await upsertHealthProfile(env.DB, { memberId: member.id }, healthData, files);
        }

        // Emergency contact is a núcleo-level attribute set from the dashboard
        // (its own step), so join does not collect it — it is preserved when
        // it already exists on the row.
        const now = new Date().toISOString();
        const existing = await env.DB.prepare(
          'SELECT id FROM ProgramAdultEnrollment WHERE programId = ? AND memberId = ?'
        )
          .bind(programId, member.id)
          .first<{ id: number }>();

        // Consents are optional here (the dashboard collects them at the
        // "Finalizar" step). Record a timestamp only when the flag is set, and
        // never clear a previously granted consent.
        if (existing) {
          await env.DB.prepare(
            `UPDATE ProgramAdultEnrollment SET relationship = ?,
             dataTreatmentAcceptedAt = CASE WHEN ? THEN ? ELSE dataTreatmentAcceptedAt END,
             participationConfirmedAt = CASE WHEN ? THEN ? ELSE participationConfirmedAt END,
             updatedAt = ? WHERE id = ?`
          )
            .bind(
              relationship,
              acceptDataTreatment ? 1 : 0,
              now,
              confirmParticipation ? 1 : 0,
              now,
              now,
              existing.id
            )
            .run();
        } else {
          await env.DB.prepare(
            `INSERT INTO ProgramAdultEnrollment
             (programId, memberId, relationship, dataTreatmentAcceptedAt, participationConfirmedAt, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              programId,
              member.id,
              relationship,
              acceptDataTreatment ? now : null,
              confirmParticipation ? now : null,
              now,
              now
            )
            .run();
        }

        // Changing a role updates this person's links only. Other guardians
        // can have the same role and must remain linked to the child.
        await env.DB.prepare(
          `UPDATE ChildGuardian SET relationship = ?, updatedAt = ?
           WHERE memberId = ?
             AND childId IN (SELECT childId FROM Enrollment WHERE programId = ?)`
        )
          .bind(relationship, now, member.id, programId)
          .run();

        return NextResponse.json(
          {
            success: true,
            memberId: member.id,
            relationship,
            classification: null,
          },
          { status: existing ? 200 : 201 }
        );
      } catch (error) {
        console.error('Error joining program:', error);
        return NextResponse.json({ error: 'Error al procesar la inscripción' }, { status: 500 });
      }
    },
    { allowFormPass: true }
  );
}
