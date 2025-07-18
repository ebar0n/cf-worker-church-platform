import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET - Fetch all announcements with optional filtering
export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // 'active', 'inactive', or null for all

  try {
    let query = 'SELECT * FROM Announcement';
    let params: any[] = [];

    // Add status filter if provided
    if (status === 'active') {
      query += ' WHERE isActive = 1';
    } else if (status === 'inactive') {
      query += ' WHERE isActive = 0';
    }

    // Always order by announcementDate DESC, createdAt DESC
    query += ' ORDER BY announcementDate DESC, createdAt DESC';

    const announcements = await env.DB.prepare(query)
      .bind(...params)
      .all();

    return NextResponse.json(announcements.results);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

// POST - Create new announcement
export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();

  try {
    const body = (await request.json()) as {
      title: string;
      content: string;
      announcementDate: string;
      department?: string;
      isActive?: boolean;
    };
    const { title, content, announcementDate, department, isActive = true } = body;

    if (!title || !content || !announcementDate) {
      return NextResponse.json(
        { error: 'Title, content, and announcement date are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Start a transaction to ensure data consistency
    const transaction = await env.DB.batch([
      // First, deactivate all announcements with dates older than the new announcement
      env.DB.prepare(
        `
        UPDATE Announcement
        SET isActive = 0, updatedAt = ?
        WHERE announcementDate < ? AND isActive = 1
      `
      ).bind(now, announcementDate),

      // Then, insert the new announcement
      env.DB.prepare(
        `
        INSERT INTO Announcement (title, content, announcementDate, department, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).bind(title, content, announcementDate, department || null, isActive ? 1 : 0, now, now),
    ]);

    // Get the newly created announcement
    const announcement = await env.DB.prepare('SELECT * FROM Announcement WHERE id = ?')
      .bind(transaction[1].meta.last_row_id)
      .first();

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}
