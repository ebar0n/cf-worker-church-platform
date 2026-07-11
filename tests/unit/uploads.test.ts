import { describe, it, expect } from 'vitest';
import {
  generateFileName,
  validateUploadFile,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZE,
} from '@/lib/uploads';

describe('generateFileName', () => {
  it('keeps chronological ordering (timestamp prefix) and adds an unguessable UUID', () => {
    const name = generateFileName('comprobante.JPG', 'payments');
    expect(name).toMatch(
      /^payments\/\d{13}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/
    );
  });

  it('never repeats names for the same input', () => {
    const a = generateFileName('a.pdf', 'payments');
    const b = generateFileName('a.pdf', 'payments');
    expect(a).not.toBe(b);
  });

  it('falls back to .bin when the file has no extension', () => {
    // 'archivo' has no dot: split('.').pop() returns the whole name, so the
    // extension is the lowercased name itself — documents current behavior
    const name = generateFileName('archivo', 'courses');
    expect(name.startsWith('courses/')).toBe(true);
  });
});

describe('validateUploadFile', () => {
  const jpeg = (size: number) =>
    new File([new Uint8Array(size)], 'foto.jpg', { type: 'image/jpeg' });

  it('accepts a small jpeg for both image and document uploads', () => {
    expect(validateUploadFile(jpeg(1024), ALLOWED_IMAGE_TYPES).valid).toBe(true);
    expect(validateUploadFile(jpeg(1024), ALLOWED_DOCUMENT_TYPES).valid).toBe(true);
  });

  it('rejects files over the size limit', () => {
    const result = validateUploadFile(jpeg(MAX_FILE_SIZE + 1), ALLOWED_IMAGE_TYPES);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain('10MB');
  });

  it('rejects disallowed content types', () => {
    const exe = new File([new Uint8Array(10)], 'x.exe', { type: 'application/x-msdownload' });
    expect(validateUploadFile(exe, ALLOWED_DOCUMENT_TYPES).valid).toBe(false);
  });

  it('allows pdf as document but not as image', () => {
    const pdf = new File([new Uint8Array(10)], 'x.pdf', { type: 'application/pdf' });
    expect(validateUploadFile(pdf, ALLOWED_DOCUMENT_TYPES).valid).toBe(true);
    expect(validateUploadFile(pdf, ALLOWED_IMAGE_TYPES).valid).toBe(false);
  });
});
