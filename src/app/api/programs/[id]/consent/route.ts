import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { withTurnstileProtection } from '@/lib/turnstile';

// Save only the current responsible adult's explicit confirmation. Other
// adults sign their own printed forms; this is not their electronic signature.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withTurnstileProtection(
    request,
    async (req) => {
      const programId = Number(id);
      const body = (await req.json()) as {
        documentID?: string;
        acceptDataTreatment?: boolean;
        confirmParticipation?: boolean;
      };
      if (
        !Number.isSafeInteger(programId) ||
        programId < 1 ||
        typeof body.documentID !== 'string' ||
        !body.documentID.trim() ||
        body.acceptDataTreatment !== true ||
        body.confirmParticipation !== true
      ) {
        return NextResponse.json(
          { error: 'Debes aceptar ambas casillas para finalizar' },
          { status: 400 }
        );
      }
      const { env } = getCloudflareContext();
      const now = new Date().toISOString();
      const result = await env.DB.prepare(
        `
      UPDATE ProgramAdultEnrollment
      SET dataTreatmentAcceptedAt = COALESCE(dataTreatmentAcceptedAt, ?),
          participationConfirmedAt = COALESCE(participationConfirmedAt, ?), updatedAt = ?
      WHERE programId = ? AND memberId = (SELECT id FROM Member WHERE documentID = ?)
        AND EXISTS (SELECT 1 FROM Program WHERE id = ? AND isActive = 1)
    `
      )
        .bind(now, now, now, programId, body.documentID.trim(), programId)
        .run();
      if (!result.meta.changes) {
        return NextResponse.json({ error: 'Inscripción activa no encontrada' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    },
    { allowFormPass: true }
  );
}
