import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { withTurnstileProtection } from '@/lib/turnstile';

// POST - Check if user is already registered for this event
// Protected: requires a Turnstile token or a valid form-pass cookie,
// since it returns member personal data.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;

  return withTurnstileProtection(
    request,
    async (req) => {
      const { env } = getCloudflareContext();

      const body = (await req.json()) as { documentID?: string };
      const documentID = body.documentID;

      if (!documentID) {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }

      try {
        const registration = await env.DB.prepare(
          `
          SELECT vr.*, m.name, m.phone, m.birthDate
          FROM VolunteerRegistration vr
          LEFT JOIN Member m ON vr.memberId = m.id
          WHERE vr.volunteerEventId = ? AND vr.memberDocumentID = ?
          `
        )
          .bind(eventId, documentID)
          .first();

        if (!registration) {
          return NextResponse.json({ error: 'Not registered' }, { status: 404 });
        }

        return NextResponse.json(registration);
      } catch (error) {
        console.error('Error checking registration:', error);
        return NextResponse.json({ error: 'Failed to check registration' }, { status: 500 });
      }
    },
    { allowFormPass: true }
  );
}
