import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

const req = (path: string, method = 'GET') =>
  new NextRequest(`https://iglesiajordanibague.org${path}`, { method });

describe('cache policy middleware', () => {
  it('gives the Turnstile config CDN-only caching for 1 hour', () => {
    const res = middleware(req('/api/turnstile-config'));
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(res.headers.get('CDN-Cache-Control')).toBe('max-age=3600');
  });

  it('caches course and event detail briefly (they carry capacity counters)', () => {
    expect(middleware(req('/api/courses/mi-curso')).headers.get('CDN-Cache-Control')).toBe(
      'max-age=60'
    );
    expect(middleware(req('/api/volunteer-events/3')).headers.get('CDN-Cache-Control')).toBe(
      'max-age=60'
    );
  });

  it('caches announcements and programs for 5 minutes', () => {
    expect(middleware(req('/api/announcements/latest')).headers.get('CDN-Cache-Control')).toBe(
      'max-age=300'
    );
    expect(middleware(req('/api/programs/7')).headers.get('CDN-Cache-Control')).toBe('max-age=300');
  });

  it('never lets sub-resources of cacheable paths inherit caching', () => {
    // capacities/check-registration change on every registration
    const res = middleware(req('/api/volunteer-events/3/capacities'));
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(res.headers.get('CDN-Cache-Control')).toBeNull();

    const enroll = middleware(req('/api/courses/mi-curso/check-enrollment', 'POST'));
    expect(enroll.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('marks admin and personal-data endpoints as never cacheable', () => {
    for (const path of ['/api/admin/dashboard', '/api/member', '/api/members/search', '/admin']) {
      const res = middleware(req(path));
      expect(res.headers.get('Cache-Control'), path).toBe('private, no-store');
      expect(res.headers.get('CDN-Cache-Control'), path).toBeNull();
    }
  });

  it('only applies CDN caching to GET requests', () => {
    const res = middleware(req('/api/announcements/latest', 'POST'));
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(res.headers.get('CDN-Cache-Control')).toBeNull();
  });
});
