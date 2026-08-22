// Service worker for the church platform PWA.
//
// Goal: volunteers install the site from Safari on iPads and use it during
// health outreach days in neighborhoods with no coverage. The app must OPEN
// offline and show the last known survey data.
//
// Hard rules:
//  - Only GET is ever intercepted. Mutations (POST/PUT/DELETE) go straight to
//    the network, untouched: an offline queue in the app owns them. A service
//    worker that answered "ok" to a mutation it never sent would silently lose
//    field data.
//  - Cloudflare Access protects /admin/* and /api/admin/*. An expired session
//    answers with a redirect to the Cloudflare login. Redirects, opaque and
//    non-200 responses are never cached and are passed through as-is so the
//    user can re-authenticate.

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `jordan-static-${CACHE_VERSION}`;
const PAGES_CACHE = `jordan-pages-${CACHE_VERSION}`;
const API_CACHE = `jordan-api-${CACHE_VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE, API_CACHE];

// Synthetic key holding the last successful navigation, used as the app shell
// when an offline navigation targets a URL that was never cached.
const SHELL_KEY = '/__sw-navigation-shell__';

// Immutable, filename-versioned or install-critical assets.
const PRECACHE_URLS = [
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
];

// Cache-first paths: hashed build output plus the icons/manifest above.
const IMMUTABLE_PREFIXES = ['/_next/static/', '/fonts/'];
const IMMUTABLE_PATHS = new Set([...PRECACHE_URLS, '/favicon.ico']);

const OFFLINE_HTML = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sin conexión</title>
<style>body{margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;
font-family:system-ui,-apple-system,sans-serif;background:#f7f6f3;color:#4b207f;padding:24px}
div{max-width:22rem;text-align:center}h1{font-size:1.25rem;margin:0 0 .5rem}
p{color:#4a4a4a;font-size:.95rem;line-height:1.5;margin:0}</style></head>
<body><div><h1>Sin conexión</h1>
<p>No pudimos cargar esta página y todavía no está guardada en el dispositivo.
Vuelve a intentarlo cuando haya señal.</p></div></body></html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Individually, so one missing asset cannot fail the whole install.
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (isCacheable(response)) await cache.put(url, response);
          } catch {
            /* offline at install time: the asset is fetched on first use */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('jordan-') && !CURRENT_CACHES.includes(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never touch mutations: the app's offline queue owns them.
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Cross-origin (fonts, analytics, the Access login itself) is left alone.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(event, request));
    return;
  }

  if (isImmutable(url)) {
    event.respondWith(cacheFirst(event, request, STATIC_CACHE));
    return;
  }

  if (isSurveyApi(url)) {
    event.respondWith(networkFirst(event, request, API_CACHE));
    return;
  }

  // Everything else: no interception, straight to the network.
});

function isImmutable(url) {
  return (
    IMMUTABLE_PATHS.has(url.pathname) ||
    IMMUTABLE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
  );
}

function isSurveyApi(url) {
  return url.pathname === '/api/admin/surveys' || url.pathname.startsWith('/api/admin/surveys/');
}

// A response is storable only if it is a real, final, successful same-origin
// answer. This is what keeps Cloudflare Access login redirects out of the
// cache: an expired session yields a redirected or opaque response, never a
// plain 200 from our own origin.
function isCacheable(response) {
  if (!response) return false;
  if (response.redirected) return false;
  if (response.status !== 200) return false;
  if (response.type !== 'basic' && response.type !== 'default') return false;
  // Guards against a redirect chain that ended on another host.
  try {
    if (response.url && new URL(response.url).origin !== self.location.origin) return false;
  } catch {
    return false;
  }
  return true;
}

// Navigations: network-first, so an online iPad always gets fresh HTML.
// Offline, fall back to this URL's cached copy and then to the last cached
// navigation, which is enough to boot the app shell and its client routing.
async function navigationStrategy(event, request) {
  const cache = await caches.open(PAGES_CACHE);

  try {
    const response = await fetch(request);

    // Access redirect (or any non-200): hand it back untouched so the user
    // lands on the Cloudflare login, and store nothing.
    if (!isCacheable(response)) return response;

    event.waitUntil(
      (async () => {
        await cache.put(request, response.clone());
        await cache.put(SHELL_KEY, response.clone());
      })()
    );
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;

    const shell = await cache.match(SHELL_KEY);
    if (shell) return shell;

    return new Response(OFFLINE_HTML, {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-SW-Offline': '1' },
    });
  }
}

// Hashed/immutable assets: serve from cache, populate on first miss.
async function cacheFirst(event, request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) {
    event.waitUntil(cache.put(request, response.clone()));
  }
  return response;
}

// Survey reads: always prefer the network, but keep the last good payload so
// the list and the metrics still render the last known state offline.
async function networkFirst(event, request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      event.waitUntil(cache.put(request, response.clone()));
    }
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: false });
    if (cached) return cached;

    return new Response(JSON.stringify({ error: 'offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-SW-Offline': '1' },
    });
  }
}
