import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET /api/files/[...path] - Serve files from R2
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { env } = getCloudflareContext();
  const { path } = await params;

  try {
    // Reconstruct the file path
    const filePath = path.join('/');

    // Get file from R2
    const object = await env.UPLOADS.get(filePath);

    if (!object) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get the file body
    const body = await object.arrayBuffer();

    // Return the file with appropriate headers
    return new NextResponse(body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Length': object.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': object.httpEtag,
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
