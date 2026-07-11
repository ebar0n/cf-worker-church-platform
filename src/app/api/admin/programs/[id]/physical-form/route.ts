import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// PATCH /api/admin/programs/[id]/physical-form - Mark the signed
// printout as received (or not) for a participant, child or adult.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();
  const { id: programIdParam } = await params;

  try {
    const programId = parseInt(programIdParam);
    if (isNaN(programId)) {
      return NextResponse.json({ error: 'Invalid program' }, { status: 400 });
    }

    const body = (await request.json()) as { documentID?: string; received?: boolean };
    if (!body.documentID || typeof body.received !== 'boolean') {
      return NextResponse.json({ error: 'documentID and received are required' }, { status: 400 });
    }

    const value = body.received ? new Date().toISOString() : null;
    const now = new Date().toISOString();

    const childUpdate = await env.DB.prepare(
      `UPDATE Enrollment SET physicalFormReceivedAt = ?, updatedAt = ?
       WHERE programId = ? AND childId = (SELECT id FROM Child WHERE documentID = ?)`
    )
      .bind(value, now, programId, body.documentID)
      .run();

    if (childUpdate.meta.changes > 0) {
      return NextResponse.json({ success: true, kind: 'child', received: body.received });
    }

    const adultUpdate = await env.DB.prepare(
      `UPDATE ProgramAdultEnrollment SET physicalFormReceivedAt = ?, updatedAt = ?
       WHERE programId = ? AND memberId = (SELECT id FROM Member WHERE documentID = ?)`
    )
      .bind(value, now, programId, body.documentID)
      .run();

    if (adultUpdate.meta.changes > 0) {
      return NextResponse.json({ success: true, kind: 'adult', received: body.received });
    }

    return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
  } catch (error) {
    console.error('Error updating physical form:', error);
    return NextResponse.json({ error: 'Failed to update physical form' }, { status: 500 });
  }
}
