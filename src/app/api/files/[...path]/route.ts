import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Prefixes that may be served publicly. Sensitive files (payment proofs)
// are only available through /api/admin/files, behind Cloudflare Access.
const PUBLIC_PREFIXES = ['courses/', 'programs/'];

// GET /api/files/[...path] - Serve public files from R2
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { env } = getCloudflareContext();
  const { path } = await params;

  try {
    // Reconstruct the file path
    const filePath = path.join('/');

    if (!PUBLIC_PREFIXES.some((prefix) => filePath.startsWith(prefix))) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get file from R2
    const object = await env.UPLOADS.get(filePath);

    if (!object) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Stream the file body directly instead of buffering it in memory
    return new NextResponse(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Length': object.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: object.httpEtag,
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
