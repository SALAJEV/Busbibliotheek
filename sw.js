const CACHE_NAME = 'busbibliotheek-v47';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/app.js?v=20260407-16',
  '/manifest.json',
  '/style.css',
  '/style.css?v=20260407-11',
  '/translations.js',
  '/translations.js?v=20260218-1',
  '/photo-descriptions.json',
  '/media/logo.png',
  '/media/navicon.png',
  '/media/hansea.png',
  '/media/favicon.ico'
];
const OPTIONAL_ASSETS = [
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js'
];

// Install event: cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const allAssets = [...CORE_ASSETS, ...OPTIONAL_ASSETS];
      await Promise.allSettled(
        allAssets.map(async (url) => {
          try {
            await cache.add(url);
          } catch (_) {
            // Keep install resilient: one failing asset must not break offline support.
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  const offlineTextResponse = new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
  });

  if (url.searchParams.has('network-check')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(() => new Response(null, { status: 204, statusText: 'No Content' }))
        .catch(() => new Response(null, { status: 503, statusText: 'Offline' }))
    );
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  const isUncachedVehiclePhotoRequest =
    url.origin === self.location.origin &&
    url.pathname.startsWith('/media/') &&
    !['/media/logo.png', '/media/navicon.png', '/media/hansea.png', '/media/favicon.ico', '/media/logo.svg'].includes(url.pathname);

  if (isUncachedVehiclePhotoRequest) {
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => offlineTextResponse));
    return;
  }

  // HTML navigation: network first with cached index fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
          return response;
        })
        .catch(async () => {
          const cachedIndex = await caches.match('/index.html', { ignoreSearch: true });
          return cachedIndex || offlineTextResponse;
        })
    );
    return;
  }

  if (url.pathname.includes('/api')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() =>
        new Response(JSON.stringify({ error: 'Realtime tijdelijk niet beschikbaar' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json; charset=UTF-8' }
        })
      )
    );
    return;
  }

  // External calls: network first, fallback to cache
  if (url.hostname !== self.location.hostname) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clonedResponse));
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache if network fails
          return caches.match(request).then(cached => cached || offlineTextResponse);
        })
    );
  } else { // Static assets: stale-while-revalidate
    event.respondWith(
      caches.match(request).then(cached => {
        const networkFetch = fetch(request)
          .then(response => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached || offlineTextResponse);

        return cached || networkFetch;
      })
    );
  }
});
