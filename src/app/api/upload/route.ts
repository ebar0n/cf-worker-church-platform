import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Allowed file types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];
const ALLOWED_DOCUMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Generate unique filename
function generateFileName(originalName: string, prefix: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'bin';
  return `${prefix}/${timestamp}-${randomId}.${extension}`;
}

// POST /api/upload - Upload file to R2
export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // 'course-image' or 'payment-proof'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['course-image', 'payment-proof'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid upload type. Must be "course-image" or "payment-proof"' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Validate file type based on upload type
    const allowedTypes = type === 'course-image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Generate unique filename with appropriate prefix
    const prefix = type === 'course-image' ? 'courses' : 'payments';
    const fileName = generateFileName(file.name, prefix);

    // Convert file to ArrayBuffer for R2
    const arrayBuffer = await file.arrayBuffer();

    // Upload to R2
    await env.UPLOADS.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Generate public URL
    // Note: You need to configure R2 public access or use a custom domain
    // For now, we'll return a path that can be served via a separate route
    const publicUrl = `/api/files/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      contentType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
