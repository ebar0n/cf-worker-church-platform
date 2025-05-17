import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET() {
  const { env } = getCloudflareContext();

  const members = await env.DB.prepare(
    'SELECT * FROM Member ORDER BY createdAt DESC'
  ).all();

  return NextResponse.json(members.results);
}
