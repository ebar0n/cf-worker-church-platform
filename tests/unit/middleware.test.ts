import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

const req = (path: string, method = 'GET') =>
  new NextRequest(`https://iglesiajordanibague.org${path}`, { method });

const STALE = 'stale-if-error=86400';

describe('cache policy middleware', () => {
  it('gives the Turnstile config CDN-only caching for 1 hour', () => {
    const res = middleware(req('/api/turnstile-config'));
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(res.headers.get('CDN-Cache-Control')).toBe(
      `max-age=3600, stale-while-revalidate=86400, ${STALE}`
    );
  });

  it('caches course and event detail briefly (they carry capacity counters)', () => {
    for (const path of ['/api/courses/mi-curso', '/api/volunteer-events/3']) {
      expect(middleware(req(path)).headers.get('CDN-Cache-Control'), path).toBe(
        `max-age=60, stale-while-revalidate=300, ${STALE}`
      );
    }
  });

  it('caches announcements and programs for 5 minutes', () => {
    for (const path of ['/api/announcements/latest', '/api/programs/7']) {
      expect(middleware(req(path)).headers.get('CDN-Cache-Control'), path).toBe(
        `max-age=300, stale-while-revalidate=3600, ${STALE}`
      );
    }
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

  it('CDN-caches dynamic landings without touching the browser Cache-Control', () => {
    for (const [path, maxAge, swr] of [
      ['/curso/mi-curso', 60, 300],
      ['/volunteer/3', 60, 300],
      ['/program/7', 300, 3600],
      ['/announcements/9', 300, 3600],
    ] as const) {
      const res = middleware(req(path));
      expect(res.headers.get('CDN-Cache-Control'), path).toBe(
        `max-age=${maxAge}, stale-while-revalidate=${swr}, ${STALE}`
      );
      // Next owns the browser Cache-Control on SSR pages
      expect(res.headers.get('Cache-Control'), path).toBeNull();
    }
  });

  it('leaves pages without a rule untouched (prerendered pages keep their own headers)', () => {
    const res = middleware(req('/announcements'));
    expect(res.headers.get('Cache-Control')).toBeNull();
    expect(res.headers.get('CDN-Cache-Control')).toBeNull();
  });
});
