import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getEnrollmentPdfData } from '@/lib/program-enrollment';
import { buildProgramAuthorizationPdf } from '@/lib/program-pdf';

// GET /api/admin/programs/[id]/pdf/[documentID] - Same pre-filled PDF,
// generated from the admin (Cloudflare Access) so the staff can print
// the whole folder.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentID: string }> }
) {
  const { env } = getCloudflareContext();
  const { id: programIdParam, documentID } = await params;

  try {
    const programId = parseInt(programIdParam);
    if (isNaN(programId)) {
      return NextResponse.json({ error: 'Invalid program' }, { status: 400 });
    }

    const data = await getEnrollmentPdfData(env.DB, programId, documentID);
    if (!data) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
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
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
