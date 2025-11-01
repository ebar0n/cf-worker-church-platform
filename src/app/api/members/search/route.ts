import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET - Search for a member by documentID
export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  const { searchParams } = new URL(request.url);
  const documentID = searchParams.get('documentID');

  if (!documentID) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  try {
    const member = await env.DB.prepare(
      'SELECT id, name, phone, birthDate FROM Member WHERE documentID = ?'
    )
      .bind(documentID)
      .first();

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error searching member:', error);
    return NextResponse.json({ error: 'Failed to search member' }, { status: 500 });
  }
}
