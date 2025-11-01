import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET - Fetch a single volunteer event by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();
  const { id } = await params;

  try {
    const event = await env.DB.prepare('SELECT * FROM VolunteerEvent WHERE id = ?')
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

// PUT - Update a volunteer event
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();
  const { id } = await params;

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      eventDate?: string;
      services?: string[];
      isActive?: boolean;
    };

    // Check if event exists
    const existingEvent = await env.DB.prepare('SELECT * FROM VolunteerEvent WHERE id = ?')
      .bind(id)
      .first();

    if (!existingEvent) {
      return NextResponse.json({ error: 'Volunteer event not found' }, { status: 404 });
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }
    if (body.eventDate !== undefined) {
      updates.push('eventDate = ?');
      values.push(body.eventDate);
    }
    if (body.services !== undefined) {
      updates.push('services = ?');
      values.push(JSON.stringify(body.services));
    }
    if (body.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(body.isActive ? 1 : 0);
    }

    // Always update the updatedAt timestamp
    updates.push('updatedAt = ?');
    values.push(new Date().toISOString());

    // Add the ID to the end of the values array for the WHERE clause
    values.push(id);

    if (updates.length === 1) {
      // Only updatedAt was updated (no fields provided)
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const query = `UPDATE VolunteerEvent SET ${updates.join(', ')} WHERE id = ?`;

    await env.DB.prepare(query)
      .bind(...values)
      .run();

    // Fetch and return the updated event
    const updatedEvent = await env.DB.prepare('SELECT * FROM VolunteerEvent WHERE id = ?')
      .bind(id)
      .first();

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating volunteer event:', error);
    return NextResponse.json({ error: 'Failed to update volunteer event' }, { status: 500 });
  }
}

// DELETE - Delete a volunteer event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext();
  const { id } = await params;

  try {
    // Check if event exists
    const existingEvent = await env.DB.prepare('SELECT * FROM VolunteerEvent WHERE id = ?')
      .bind(id)
      .first();

    if (!existingEvent) {
      return NextResponse.json({ error: 'Volunteer event not found' }, { status: 404 });
    }

    await env.DB.prepare('DELETE FROM VolunteerEvent WHERE id = ?').bind(id).run();

    return NextResponse.json({ message: 'Volunteer event deleted successfully' });
  } catch (error) {
    console.error('Error deleting volunteer event:', error);
    return NextResponse.json({ error: 'Failed to delete volunteer event' }, { status: 500 });
  }
}
