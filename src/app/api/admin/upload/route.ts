import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { ALLOWED_IMAGE_TYPES, validateUploadFile, uploadFileToR2 } from '@/lib/uploads';

// POST /api/admin/upload - Upload course images to R2 (protected by Cloudflare Access)
export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validation = validateUploadFile(file, ALLOWED_IMAGE_TYPES);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const fileName = await uploadFileToR2(env.UPLOADS, file, 'courses');

    // Course images are public, served via the public files route
    return NextResponse.json({
      success: true,
      url: `/api/files/${fileName}`,
      fileName,
      contentType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
