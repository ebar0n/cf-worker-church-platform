import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET /api/members/search - Search members by documentID
export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();

  try {
    const { searchParams } = new URL(request.url);
    const documentID = searchParams.get('documentID');

    if (!documentID) {
      return NextResponse.json({ error: 'documentID parameter is required' }, { status: 400 });
    }

    // Search for member by documentID
    const member = (await env.DB.prepare('SELECT * FROM Member WHERE documentID = ?')
      .bind(documentID)
      .first()) as any;

    if (member) {
      return NextResponse.json({
        message: 'Member found',
        documentID,
        found: true,
        member: {
          id: member.id,
          name: member.name,
          phone: member.phone,
          birthDate: member.birthDate,
          updatedAt: member.updatedAt,
        },
      });
    } else {
      return NextResponse.json({
        message: 'Member not found',
        documentID,
        found: false,
        member: null,
      });
    }
  } catch (error) {
    console.error('Error searching members:', error);
    return NextResponse.json({ error: 'Failed to search members' }, { status: 500 });
  }
}
