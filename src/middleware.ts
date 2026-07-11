import { NextRequest, NextResponse } from 'next/server';

// Caching policy for Workers Cache (cache.enabled in wrangler.jsonc).
// Cloudflare serves cached responses from the CDN without running the Worker,
// honoring the Cache-Control / CDN-Cache-Control headers set here.
//
// Static assets get public browser+CDN caching via public/_headers, and
// prerendered pages are already CDN-cacheable via Next's own s-maxage.
// Everything listed below is cached on the CDN only — browsers always
// revalidate. Anything else under /api and /admin is explicitly
// non-cacheable so heuristic freshness can never cache personal data.
//
// Stale directives make the cache robust: after max-age the CDN keeps
// serving the stale copy while it revalidates in the background
// (stale-while-revalidate), and keeps serving it if the Worker errors
// (stale-if-error). They must live in CDN-Cache-Control: s-maxage or
// must-revalidate in the same header would disable them (RFC 9111 §4.2.4).

interface CdnRule {
  pattern: RegExp;
  maxAge: number;
  staleWhileRevalidate: number;
}

const STALE_IF_ERROR_SECONDS = 86400; // survive Worker failures for a day

const API_CDN_CACHE_RULES: CdnRule[] = [
  // Site key is effectively static
  { pattern: /^\/api\/turnstile-config$/, maxAge: 3600, staleWhileRevalidate: 86400 },
  // Content that changes only when an admin edits it
  { pattern: /^\/api\/programs\/[^/]+$/, maxAge: 300, staleWhileRevalidate: 3600 },
  { pattern: /^\/api\/announcements(\/.*)?$/, maxAge: 300, staleWhileRevalidate: 3600 },
  // Includes enrollment/capacity counters: keep short so availability stays fresh
  { pattern: /^\/api\/courses\/[^/]+$/, maxAge: 60, staleWhileRevalidate: 300 },
  { pattern: /^\/api\/volunteer-events\/[^/]+$/, maxAge: 60, staleWhileRevalidate: 300 },
];

// Dynamic SSR landings shared in bursts (WhatsApp links). Next marks them
// no-store for browsers — correct, they render D1 data — but a short
// CDN-Cache-Control (which takes precedence at the edge) absorbs traffic
// spikes without running the Worker. Live counters shown in these pages can
// lag by at most the TTL; the write endpoints always re-validate capacity.
const PAGE_CDN_CACHE_RULES: CdnRule[] = [
  { pattern: /^\/curso\/[^/]+$/, maxAge: 60, staleWhileRevalidate: 300 },
  { pattern: /^\/volunteer\/[^/]+$/, maxAge: 60, staleWhileRevalidate: 300 },
  { pattern: /^\/program\/[^/]+$/, maxAge: 300, staleWhileRevalidate: 3600 },
  { pattern: /^\/announcements\/[^/]+$/, maxAge: 300, staleWhileRevalidate: 3600 },
];

function cdnDirectives(rule: CdnRule): string {
  return `max-age=${rule.maxAge}, stale-while-revalidate=${rule.staleWhileRevalidate}, stale-if-error=${STALE_IF_ERROR_SECONDS}`;
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  if (request.method === 'GET') {
    const apiRule = API_CDN_CACHE_RULES.find((r) => r.pattern.test(pathname));
    if (apiRule) {
      // CDN caches (and serves stale) for the rule's windows; browsers
      // always revalidate
      response.headers.set('Cache-Control', 'no-store');
      response.headers.set('CDN-Cache-Control', cdnDirectives(apiRule));
      return response;
    }

    const pageRule = PAGE_CDN_CACHE_RULES.find((r) => r.pattern.test(pathname));
    if (pageRule) {
      // Only the CDN directive: Next already sets the right browser
      // Cache-Control for SSR pages and must keep owning it
      response.headers.set('CDN-Cache-Control', cdnDirectives(pageRule));
      return response;
    }
  }

  if (pathname.startsWith('/api') || pathname.startsWith('/admin')) {
    // Safe default: dynamic or personal data, never cached anywhere
    response.headers.set('Cache-Control', 'private, no-store');
  }

  return response;
}

export const config = {
  // /api/files serves R2 objects and sets its own immutable cache headers
  matcher: [
    '/api/((?!files/).*)',
    '/admin/:path*',
    '/curso/:path*',
    '/volunteer/:path*',
    '/program/:path*',
    '/announcements/:path*',
  ],
};
