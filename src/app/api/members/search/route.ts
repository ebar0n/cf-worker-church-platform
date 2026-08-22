import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { withTurnstileProtection } from '@/lib/turnstile';

// POST /api/members/search - Search members by documentID
// Protected: requires a Turnstile token or a valid form-pass cookie,
// since it returns member personal data.
export async function POST(request: NextRequest) {
  return withTurnstileProtection(
    request,
    async (req) => {
      const { env } = getCloudflareContext();

      try {
        const body = (await req.json()) as { documentID?: string };
        const documentID = body.documentID;

        if (!documentID) {
          return NextResponse.json({ error: 'documentID is required' }, { status: 400 });
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
              email: member.email,
              birthDate: member.birthDate,
              gender: member.gender,
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
    },
    { allowFormPass: true }
  );
}
