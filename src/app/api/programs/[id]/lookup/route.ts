import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { withTurnstileProtection } from '@/lib/turnstile';
import { classify } from '@/lib/age-classification';
import { ANCHORED_FAMILY_ADULTS_SQL } from '@/lib/program-enrollment';

// POST /api/programs/[id]/lookup - "My family group" view for a tutor:
// their adult enrollment, health record, and the children they are guardian
// of (or registered) that are enrolled in this program.
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

        const body = (await req.json()) as { documentID?: string };
        if (!body.documentID) {
          return NextResponse.json({ error: 'documentID es requerido' }, { status: 400 });
        }

        const adult = await env.DB.prepare(
          `SELECT m.id as memberId, m.name, m.documentID, m.phone, m.birthDate, m.email, m.gender,
                  pae.relationship, pae.dataTreatmentAcceptedAt, pae.participationConfirmedAt,
                  pae.physicalFormReceivedAt,
                  pae.emergencyContactName, pae.emergencyContactPhone, pae.emergencyContactRelation,
                  hp.bloodType, hp.eps, hp.allergies, hp.conditions, hp.medications,
                  hp.photoUrl, hp.idDocumentUrl, hp.epsCertificateUrl
           FROM Member m
           JOIN ProgramAdultEnrollment pae ON pae.memberId = m.id AND pae.programId = ?
           LEFT JOIN HealthProfile hp ON hp.memberId = m.id
           WHERE m.documentID = ?`
        )
          .bind(programId, body.documentID)
          .first<any>();

        if (!adult) {
          // Not in the program yet: return existing Member + health data so the
          // registration step arrives pre-filled
          const member = await env.DB.prepare(
            `SELECT m.name, m.phone, m.birthDate, m.email, m.gender,
                    hp.bloodType, hp.eps, hp.allergies, hp.conditions, hp.medications,
                    hp.photoUrl, hp.idDocumentUrl, hp.epsCertificateUrl
             FROM Member m
             LEFT JOIN HealthProfile hp ON hp.memberId = m.id
             WHERE m.documentID = ?`
          )
            .bind(body.documentID)
            .first();

          return NextResponse.json({ found: false, adult: null, children: [], member });
        }

        // One row per enrolled child. relationship comes from a subquery so a
        // child with several ChildGuardian rows can never duplicate the child.
        const children = await env.DB.prepare(
          `SELECT c.id as childId, c.name, c.documentID, c.gender, c.birthDate,
                  (SELECT cg.relationship FROM ChildGuardian cg
                   WHERE cg.childId = c.id AND cg.memberId = ? LIMIT 1) as relationship,
                  e.physicalFormReceivedAt,
                  hp.bloodType, hp.eps, hp.allergies, hp.conditions, hp.medications,
                  hp.photoUrl, hp.idDocumentUrl, hp.epsCertificateUrl
           FROM Child c
           JOIN Enrollment e ON e.childId = c.id AND e.programId = ?
           LEFT JOIN HealthProfile hp ON hp.childId = c.id
           WHERE e.enrolledByMemberId = ?
              OR EXISTS (SELECT 1 FROM ChildGuardian cg
                         WHERE cg.childId = c.id AND cg.memberId = ?)
           ORDER BY c.birthDate`
        )
          .bind(adult.memberId, programId, adult.memberId, adult.memberId)
          .all();

        // Every enrolled adult that shares a child or the family anchor with
        // the looked-up adult (the whole núcleo), plus the looked-up adult itself. relationship is
        // taken against any of the group's children.
        const adults = await env.DB.prepare(
          `SELECT DISTINCT m.id as memberId, m.name, m.documentID, m.phone, m.birthDate, m.email, m.gender,
                  pae.relationship, pae.physicalFormReceivedAt,
                  hp.bloodType, hp.eps, hp.allergies, hp.conditions, hp.medications,
                  hp.photoUrl, hp.idDocumentUrl, hp.epsCertificateUrl
           FROM ProgramAdultEnrollment pae
           JOIN Member m ON m.id = pae.memberId
           LEFT JOIN HealthProfile hp ON hp.memberId = m.id
           WHERE pae.programId = ?
             AND (
               m.id = ?
               OR m.id IN (
                 SELECT cg2.memberId FROM ChildGuardian cg2
                 JOIN ChildGuardian cg3 ON cg3.childId = cg2.childId
                 WHERE cg3.memberId = ?
               )
               OR m.id IN (${ANCHORED_FAMILY_ADULTS_SQL})
             )
           ORDER BY m.name`
        )
          .bind(programId, adult.memberId, adult.memberId, programId, adult.memberId)
          .all();

        return NextResponse.json({
          found: true,
          adult: {
            ...adult,
            classification: null,
          },
          adults: (adults.results || []).map((a: any) => ({
            ...a,
            isSelf: a.memberId === adult.memberId,
            classification: null,
          })),
          children: (children.results || []).map((child: any) => ({
            ...child,
            classification: child.birthDate ? classify(child.birthDate) : null,
          })),
        });
      } catch (error) {
        console.error('Error looking up program group:', error);
        return NextResponse.json({ error: 'Error al consultar la inscripción' }, { status: 500 });
      }
    },
    { allowFormPass: true }
  );
}
