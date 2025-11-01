import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET - Fetch all volunteer registrations for an event
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { env } = getCloudflareContext();
  const eventId = params.id;

  try {
    // First, verify the event exists
    const event = await env.DB.prepare('SELECT * FROM VolunteerEvent WHERE id = ?')
      .bind(eventId)
      .first();

    if (!event) {
      return NextResponse.json({ error: 'Volunteer event not found' }, { status: 404 });
    }

    // Get all registrations for this event
    const registrations = await env.DB.prepare(
      `
      SELECT * FROM VolunteerRegistration
      WHERE volunteerEventId = ?
      ORDER BY createdAt DESC
    `
    )
      .bind(eventId)
      .all();

    // For each registration, fetch the member information if memberId exists
    const registrationsWithMembers = await Promise.all(
      (registrations.results as any[]).map(async (registration) => {
        if (registration.memberId) {
          const member = await env.DB.prepare(
            'SELECT id, name, phone, email FROM Member WHERE id = ?'
          )
            .bind(registration.memberId)
            .first();

          return {
            ...registration,
            member,
          };
        } else {
          // Try to find member by documentID
          const member = await env.DB.prepare(
            'SELECT id, name, phone, email FROM Member WHERE documentID = ?'
          )
            .bind(registration.memberDocumentID)
            .first();

          return {
            ...registration,
            member,
          };
        }
      })
    );

    return NextResponse.json(registrationsWithMembers);
  } catch (error) {
    console.error('Error fetching volunteer registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volunteer registrations' },
      { status: 500 }
    );
  }
}
