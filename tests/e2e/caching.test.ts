import { describe, it, expect } from 'vitest';
import { TEST_COURSE_SLUG } from './config';
import { getRes } from './helpers';

// Workers Cache policy: static assets are cached by browser+CDN, selected
// public GET APIs by the CDN only, everything personal/admin never.
describe('cache headers', () => {
  it('CDN-caches selected public APIs, browsers always revalidate', async () => {
    const res = await getRes('/api/turnstile-config');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('cdn-cache-control')).toBe('max-age=3600');
  });

  it('caches course detail briefly (carries capacity counters)', async () => {
    const res = await getRes(`/api/courses/${TEST_COURSE_SLUG}`);
    expect(res.headers.get('cdn-cache-control')).toBe('max-age=60');
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('never caches admin responses', async () => {
    const res = await getRes('/api/admin/dashboard');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    expect(res.headers.get('cdn-cache-control')).toBeNull();
  });

  it('serves prerendered pages as CDN-cacheable', async () => {
    const res = await getRes('/');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('s-maxage');
  });

  it('keeps dynamic landings uncached', async () => {
    const res = await getRes(`/curso/${TEST_COURSE_SLUG}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('serves hashed build assets as immutable', async () => {
    const home = await (await getRes('/')).text();
    const asset = home.match(/\/_next\/static\/[^"]+\.(?:css|js)/)?.[0];
    expect(asset, 'no /_next/static asset found in home HTML').toBeTruthy();
    const res = await getRes(asset!);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
  });
});
