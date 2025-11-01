import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET - Fetch a single volunteer event (public)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { env } = getCloudflareContext();
  const id = params.id;

  try {
    const event = await env.DB.prepare(
      'SELECT id, title, description, eventDate, services, isActive FROM VolunteerEvent WHERE id = ?'
    )
      .bind(id)
      .first();

    if (!event) {
      return NextResponse.json({ error: 'Volunteer event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching volunteer event:', error);
    return NextResponse.json({ error: 'Failed to fetch volunteer event' }, { status: 500 });
  }
}
