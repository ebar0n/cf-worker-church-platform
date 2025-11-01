import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET - Check if user is already registered for this event
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();
  const { id: eventId } = await params;
  const { searchParams } = new URL(request.url);
  const documentID = searchParams.get('documentID');

  if (!documentID) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  try {
    const registration = await env.DB.prepare(
      `
      SELECT vr.*, m.name, m.phone, m.birthDate
      FROM VolunteerRegistration vr
      LEFT JOIN Member m ON vr.memberId = m.id
      WHERE vr.volunteerEventId = ? AND vr.memberDocumentID = ?
      `
    )
      .bind(eventId, documentID)
      .first();

    if (!registration) {
      return NextResponse.json({ error: 'Not registered' }, { status: 404 });
    }

    return NextResponse.json(registration);
  } catch (error) {
    console.error('Error checking registration:', error);
    return NextResponse.json({ error: 'Failed to check registration' }, { status: 500 });
  }
}
