import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// PUT - Update announcement
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { env } = getCloudflareContext();

  try {
    const id = parseInt(params.id);
    const body = (await request.json()) as {
      title: string;
      content: string;
      announcementDate: string;
      department?: string;
      isActive?: boolean;
    };
    const { title, content, announcementDate, department, isActive } = body;

    if (!title || !content || !announcementDate) {
      return NextResponse.json(
        { error: 'Title, content, and announcement date are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Get the current announcement to compare dates
    const currentAnnouncement = (await env.DB.prepare(
      'SELECT announcementDate, isActive FROM Announcement WHERE id = ?'
    )
      .bind(id)
      .first()) as { announcementDate: string; isActive: number } | null;

    if (!currentAnnouncement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // If the announcement is being activated and the date is newer than the current one,
    // deactivate all announcements with older dates
    if (isActive && announcementDate > currentAnnouncement.announcementDate) {
      await env.DB.prepare(
        `
        UPDATE Announcement
        SET isActive = 0, updatedAt = ?
        WHERE announcementDate < ? AND isActive = 1 AND id != ?
      `
      )
        .bind(now, announcementDate, id)
        .run();
    }

    // Update the announcement
    await env.DB.prepare(
      `
      UPDATE Announcement
      SET title = ?, content = ?, announcementDate = ?, department = ?, isActive = ?, updatedAt = ?
      WHERE id = ?
    `
    )
      .bind(title, content, announcementDate, department || null, isActive ? 1 : 0, now, id)
      .run();

    const announcement = await env.DB.prepare('SELECT * FROM Announcement WHERE id = ?')
      .bind(id)
      .first();

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

// DELETE - Delete announcement
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { env } = getCloudflareContext();

  try {
    const id = parseInt(params.id);

    await env.DB.prepare('DELETE FROM Announcement WHERE id = ?').bind(id).run();

    return NextResponse.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
