import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET /api/admin/files/[...path] - Serve files from R2 (protected by Cloudflare Access)
// Used for sensitive files like payment proofs that must not be public.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { env } = getCloudflareContext();
  const { path } = await params;

  try {
    const filePath = path.join('/');

    const object = await env.UPLOADS.get(filePath);

    if (!object) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Stream the body; private so it is never stored in shared caches
    return new NextResponse(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Length': object.size.toString(),
        'Cache-Control': 'private, no-store',
        ETag: object.httpEtag,
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
