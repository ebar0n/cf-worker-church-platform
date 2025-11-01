import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET - Fetch all volunteer events with optional filtering
export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // 'active', 'inactive', or null for all

  try {
    let query = 'SELECT * FROM VolunteerEvent';
    let params: any[] = [];

    // Add status filter if provided
    if (status === 'active') {
      query += ' WHERE isActive = 1';
    } else if (status === 'inactive') {
      query += ' WHERE isActive = 0';
    }

    // Always order by eventDate DESC, createdAt DESC
    query += ' ORDER BY eventDate DESC, createdAt DESC';

    const events = await env.DB.prepare(query)
      .bind(...params)
      .all();

    // For each event, count the number of volunteer registrations
    const eventsWithCounts = await Promise.all(
      (events.results as any[]).map(async (event) => {
        const countResult = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM VolunteerRegistration WHERE volunteerEventId = ?'
        )
          .bind(event.id)
          .first();

        return {
          ...event,
          _count: {
            registrations: countResult ? (countResult as any).count : 0,
          },
        };
      })
    );

    return NextResponse.json(eventsWithCounts);
  } catch (error) {
    console.error('Error fetching volunteer events:', error);
    return NextResponse.json({ error: 'Failed to fetch volunteer events' }, { status: 500 });
  }
}

// POST - Create new volunteer event
export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();

  try {
    const body = (await request.json()) as {
      title: string;
      description: string;
      eventDate: string;
      services?: string[];
      isActive?: boolean;
    };
    const { title, description, eventDate, services, isActive = true } = body;

    if (!title || !description || !eventDate) {
      return NextResponse.json(
        { error: 'Title, description, and event date are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const servicesJson = services ? JSON.stringify(services) : null;

    const result = await env.DB.prepare(
      `
      INSERT INTO VolunteerEvent (title, description, eventDate, services, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    )
      .bind(title, description, eventDate, servicesJson, isActive ? 1 : 0, now, now)
      .run();

    // Get the newly created volunteer event
    const event = await env.DB.prepare('SELECT * FROM VolunteerEvent WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating volunteer event:', error);
    return NextResponse.json({ error: 'Failed to create volunteer event' }, { status: 500 });
  }
}
