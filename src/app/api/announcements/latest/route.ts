import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();

  try {
    // Get all active announcements
    const announcements = await env.DB.prepare(
      `
      SELECT * FROM Announcement
      WHERE isActive = 1
      ORDER BY announcementDate DESC, createdAt DESC
      LIMIT 10
    `
    ).all();

    console.log('Debug - Active announcements found:', announcements.results.length);
    console.log('Debug - Announcements:', announcements.results);

    return NextResponse.json(announcements.results);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}
