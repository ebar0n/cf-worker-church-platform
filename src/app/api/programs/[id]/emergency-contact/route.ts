import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { withTurnstileProtection } from '@/lib/turnstile';
import { emergencyContactSchema, propagateEmergencyContact } from '@/lib/program-enrollment';

// PUT /api/programs/[id]/emergency-contact - Set the núcleo emergency
// contact (one per family). Any enrolled adult of the group can set it; it is
// shared across the whole núcleo.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        const body = (await req.json()) as {
          tutorDocumentID?: string;
          emergencyContactName?: string;
          emergencyContactPhone?: string;
          emergencyContactRelation?: string;
        };

        if (!body.tutorDocumentID) {
          return NextResponse.json(
            { error: 'Documento del responsable requerido' },
            { status: 400 }
          );
        }

        const parse = emergencyContactSchema.safeParse({
          emergencyContactName: body.emergencyContactName,
          emergencyContactPhone: body.emergencyContactPhone,
          emergencyContactRelation: body.emergencyContactRelation,
        });
        if (!parse.success) {
          return NextResponse.json(
            { error: 'Nombre y teléfono del contacto de emergencia son requeridos' },
            { status: 400 }
          );
        }

        const adult = await env.DB.prepare(
          `SELECT m.id FROM Member m
           JOIN ProgramAdultEnrollment pae ON pae.memberId = m.id AND pae.programId = ?
           WHERE m.documentID = ?`
        )
          .bind(programId, body.tutorDocumentID)
          .first<{ id: number }>();

        if (!adult) {
          return NextResponse.json(
            { error: 'El responsable no está inscrito en el programa' },
            { status: 403 }
          );
        }

        await propagateEmergencyContact(env.DB, programId, adult.id, parse.data);

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error setting emergency contact:', error);
        return NextResponse.json({ error: 'Error al guardar el contacto' }, { status: 500 });
      }
    },
    { allowFormPass: true }
  );
}
