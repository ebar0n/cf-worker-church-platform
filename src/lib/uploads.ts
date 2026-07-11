// Shared helpers for R2 file uploads

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Generate unique filename: timestamp prefix keeps chronological ordering,
// randomUUID makes the name unguessable
export function generateFileName(originalName: string, prefix: string): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop()?.toLowerCase() || 'bin';
  return `${prefix}/${timestamp}-${crypto.randomUUID()}.${extension}`;
}

export function validateUploadFile(
  file: File,
  allowedTypes: string[]
): { valid: true } | { valid: false; error: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 10MB' };
  }
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }
  return { valid: true };
}

export async function uploadFileToR2(
  bucket: R2Bucket,
  file: File,
  prefix: string
): Promise<string> {
  const fileName = generateFileName(file.name, prefix);
  await bucket.put(fileName, file, {
    httpMetadata: {
      contentType: file.type,
    },
  });
  return fileName;
}
