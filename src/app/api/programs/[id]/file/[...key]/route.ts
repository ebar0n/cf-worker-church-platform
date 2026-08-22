import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { withTurnstileProtection } from '@/lib/turnstile';

// GET /api/programs/[id]/file/[...key] - Owner-scoped view of an enrollment
// file (photo / ID copy). These live under the `enrollments/` R2 prefix and
// are otherwise admin-only. The key is an unguessable UUID handed to the owner
// by the lookup response, so possession of the capability URL plus a valid
// form-pass (anti-bot) is what grants access. Restricted to the enrollments/
// prefix so it can never reach other buckets' data (e.g. payment proofs).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;

  return withTurnstileProtection(
    request,
    async () => {
      const { env } = getCloudflareContext();

      try {
        const filePath = key.join('/');
        if (!filePath.startsWith('enrollments/')) {
          return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const object = await env.UPLOADS.get(filePath);
        if (!object) {
          return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Stream the body; private so it is never stored in shared caches.
        return new NextResponse(object.body, {
          headers: {
            'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
            'Content-Length': object.size.toString(),
            'Cache-Control': 'private, no-store',
            ETag: object.httpEtag,
          },
        });
      } catch (error) {
        console.error('Error serving enrollment file:', error);
        return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
      }
    },
    { allowFormPass: true }
  );
}
