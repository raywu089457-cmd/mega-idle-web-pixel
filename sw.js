/**
 * Service Worker — Offline caching for MEGA IDLE (放置王國)
 * Bump CACHE_NAME on every gameplay release so old Pages clients do not keep
 * serving a stale cached index.html.
 */

const CACHE_NAME = 'hunter-village-v20';   // bump to v20 — install event 自動掃 src/ 並 precache,離線 reload 可用
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
];
// 由 install 動態掃 src/ 補上;這裡放常見入口,讓 fetch handler 觸發 src/*.js runtime cache
const SRC_GLOB = [
  './src/main.js', './src/data.js', './src/util.js', './src/state.js', './src/bonuses.js',
  './src/resources-buildings.js', './src/skills.js', './src/audio.js', './src/inventory.js',
  './src/heroes-stats.js', './src/meta.js', './src/combat.js', './src/combat-party.js',
  './src/expeditions.js', './src/scene.js', './src/ui.js', './src/selftest.js',
  './src/settings-and-init.js', './src/window-bridge.js',
];

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        // 先加 ASSETS_TO_CACHE(失敗不中斷,網路下才需要)
        await cache.addAll(ASSETS_TO_CACHE).catch(e => console.log('[SW] asset precache partial:', e.message));
        // 再加 src/*.js(略過 404,例如 sw.js 不在 src/)
        for (const url of SRC_GLOB) {
          try {
            const resp = await fetch(url, { cache: 'no-store' });
            if (resp.ok) await cache.put(url, resp);
            else console.log('[SW] skip 404:', url);
          } catch (e) { console.log('[SW] skip offline:', url); }
        }
        console.log('[SW] Cached', ASSETS_TO_CACHE.length + SRC_GLOB.length, 'assets');
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// ─── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }

        // Not in cache — fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache if not a valid response
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone the response before caching
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // Offline — return offline page if available
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// ─── Background Sync (for future save functionality) ─────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-save') {
    console.log('[SW] Background sync triggered');
    // Future: sync save data to server if needed
  }
});

// ─── Push Notifications (placeholder for future) ─────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Your kingdom needs attention!',
    icon: data.icon || '/icon.png',
    badge: '/icon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Idle Kingdom', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
