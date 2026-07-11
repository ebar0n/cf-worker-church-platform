import { NextRequest, NextResponse } from 'next/server';

// Caching policy for Workers Cache (cache.enabled in wrangler.jsonc).
// Cloudflare serves cached responses from the CDN without running the Worker,
// honoring the Cache-Control / CDN-Cache-Control headers set here.
//
// Static assets get public browser+CDN caching via public/_headers.
// API responses listed below are cached on the CDN only (browsers always
// revalidate); everything else under /api and /admin is explicitly
// non-cacheable so heuristic freshness can never cache personal data.

const CDN_CACHE_RULES: Array<{ pattern: RegExp; cdnMaxAge: number }> = [
  // Site key is effectively static
  { pattern: /^\/api\/turnstile-config$/, cdnMaxAge: 3600 },
  // Content that changes only when an admin edits it
  { pattern: /^\/api\/programs\/[^/]+$/, cdnMaxAge: 300 },
  { pattern: /^\/api\/announcements(\/.*)?$/, cdnMaxAge: 300 },
  // Includes enrollment/capacity counters: keep short so availability stays fresh
  { pattern: /^\/api\/courses\/[^/]+$/, cdnMaxAge: 60 },
  { pattern: /^\/api\/volunteer-events\/[^/]+$/, cdnMaxAge: 60 },
];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  if (request.method === 'GET') {
    const rule = CDN_CACHE_RULES.find((r) => r.pattern.test(pathname));
    if (rule) {
      // CDN caches for cdnMaxAge; browsers always revalidate
      response.headers.set('Cache-Control', 'no-store');
      response.headers.set('CDN-Cache-Control', `max-age=${rule.cdnMaxAge}`);
      return response;
    }
  }

  // Safe default: dynamic or personal data, never cached anywhere
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  // /api/files serves R2 objects and sets its own immutable cache headers
  matcher: ['/api/((?!files/).*)', '/admin/:path*'],
};
