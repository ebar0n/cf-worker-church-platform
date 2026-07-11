import { describe, it, expect } from 'vitest';
import { BASE_URL } from './config';
import { getRes } from './helpers';

describe('public files route', () => {
  it('blocks payment proofs', async () => {
    const res = await getRes('/api/files/payments/anything.jpg');
    expect(res.status).toBe(404);
  });

  it('serves only known public prefixes', async () => {
    const res = await getRes('/api/files/secret-prefix/x.txt');
    expect(res.status).toBe(404);
  });
});

describe('admin upload + admin files roundtrip', () => {
  it('uploads a course image and serves it publicly', async () => {
    const form = new FormData();
    form.append('file', new File([new Uint8Array(32)], 'imagen.png', { type: 'image/png' }));

    const upload = await fetch(`${BASE_URL}/api/admin/upload`, { method: 'POST', body: form });
    expect(upload.status).toBe(200);
    const data = (await upload.json()) as { url: string; fileName: string };
    expect(data.fileName).toMatch(/^courses\/\d+-[0-9a-f-]{36}\.png$/);

    // course images are public
    const serve = await getRes(data.url);
    expect(serve.status).toBe(200);
    expect(serve.headers.get('content-type')).toBe('image/png');
    expect(serve.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');

    // and also reachable through the admin route (Access-protected in prod)
    const adminServe = await getRes(`/api/admin/files/${data.fileName}`);
    expect(adminServe.status).toBe(200);
    expect(adminServe.headers.get('cache-control')).toBe('private, no-store');
  });

  it('rejects disallowed file types', async () => {
    const form = new FormData();
    form.append('file', new File([new Uint8Array(8)], 'doc.pdf', { type: 'application/pdf' }));
    const res = await fetch(`${BASE_URL}/api/admin/upload`, { method: 'POST', body: form });
    expect(res.status).toBe(400);
  });
});
