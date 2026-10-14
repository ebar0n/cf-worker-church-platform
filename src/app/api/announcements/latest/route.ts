import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();

  // The home carousel only needs the latest 10; the announcements page
  // paginates over every active one and asks for them with ?all=1.
  const all = request.nextUrl.searchParams.get('all') === '1';

  try {
    // Get all active announcements
    const announcements = await env.DB.prepare(
      `
      SELECT * FROM Announcement
      WHERE isActive = 1
      ORDER BY announcementDate DESC, createdAt DESC
      ${all ? '' : 'LIMIT 10'}
    `
    ).all();

    return NextResponse.json(announcements.results);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}
