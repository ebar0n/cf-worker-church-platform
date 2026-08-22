import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { withTurnstileProtection } from '@/lib/turnstile';
import { getEnrollmentPdfData } from '@/lib/program-enrollment';
import { buildProgramAuthorizationPdf } from '@/lib/program-pdf';

// GET /api/programs/[id]/pdf/[documentID] - Pre-filled authorization PDF
// for the program participant (child or adult). Token via ?token= or form-pass
// cookie (the registration flow already carries it).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentID: string }> }
) {
  const { id: programIdParam, documentID } = await params;

  return withTurnstileProtection(
    request,
    async () => {
      const { env } = getCloudflareContext();

      try {
        const programId = parseInt(programIdParam);
        if (isNaN(programId)) {
          return NextResponse.json({ error: 'Programa inválido' }, { status: 400 });
        }

        const data = await getEnrollmentPdfData(env.DB, programId, documentID);
        if (!data) {
          return NextResponse.json({ error: 'Participante no encontrado' }, { status: 404 });
        }

        const pdf = await buildProgramAuthorizationPdf(data);
        return new NextResponse(Buffer.from(pdf), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="autorizacion-${documentID}.pdf"`,
            'Cache-Control': 'private, no-store',
          },
        });
      } catch (error) {
        console.error('Error generating program PDF:', error);
        return NextResponse.json({ error: 'Error al generar el PDF' }, { status: 500 });
      }
    },
    { allowFormPass: true }
  );
}
