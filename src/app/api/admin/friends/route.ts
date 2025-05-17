import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET() {
  const { env } = getCloudflareContext();

  const requests = await env.DB.prepare(
    'SELECT * FROM FriendRequest ORDER BY createdAt DESC'
  ).all();

  return NextResponse.json(requests.results);
}
