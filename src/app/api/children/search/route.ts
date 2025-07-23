import { NextRequest, NextResponse } from 'next/server';
import { withTurnstileProtection } from '@/lib/turnstile';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// POST /api/children/search - Search children by documentID (protected by Turnstile)
export async function POST(request: NextRequest) {
  return withTurnstileProtection(request, async (req) => {
    const { env } = getCloudflareContext();

    try {
      const body = (await req.json()) as { documentID: string };
      const { documentID } = body;

      if (!documentID) {
        return NextResponse.json({ error: 'documentID is required' }, { status: 400 });
      }

      // Search for child by documentID
      const child = (await env.DB.prepare('SELECT * FROM Child WHERE documentID = ?')
        .bind(documentID)
        .first()) as any;

      if (child) {
        return NextResponse.json({
          message: 'Child found',
          documentID,
          found: true,
          child: {
            id: child.id,
            name: child.name,
            documentID: child.documentID,
            gender: child.gender,
            birthDate: child.birthDate,
            createdAt: child.createdAt,
            updatedAt: child.updatedAt,
          },
        });
      } else {
        return NextResponse.json({
          message: 'Child not found',
          documentID,
          found: false,
          child: null,
        });
      }
    } catch (error) {
      console.error('Error searching children:', error);
      return NextResponse.json({ error: 'Failed to search children' }, { status: 500 });
    }
  });
}
