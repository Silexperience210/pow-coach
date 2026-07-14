/* PoW Coach — service worker (PWA offline shell)
   - navigation → network-first (l'app reste fraîche), repli cache hors-ligne
   - statique même origine → cache-first
   - CDN (fonts, MediaPipe JS/wasm, noble) → stale-while-revalidate
   - API (/claim, /session, /balance, /auth, /faucet) → JAMAIS de cache
   - modèle MediaPipe (~10 Mo, *.task) → non mis en cache (trop lourd) */
const CACHE = 'powcoach-v7';
const SHELL = ['/', '/index.html', '/app.js', '/app.css', '/manifest.json', '/vendor/qrcode.min.js',
  '/vendor/leaflet.js', '/vendor/leaflet.css', '/vendor/noble-secp256k1.js',
  '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  // cache:'reload' → on rapatrie le shell frais (contourne le cache HTTP/CDN) à chaque version
  e.waitUntil(caches.open(CACHE)
    .then((c) => Promise.all(SHELL.map((u) => fetch(u, { cache: 'reload' }).then((r) => c.put(u, r)).catch(() => {}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;

  // API dynamique : ne jamais servir depuis le cache
  if (sameOrigin && /^\/(claim|session|balance|auth|faucet)(\/|$)/.test(url.pathname)) return;
  // gros modèle MediaPipe : réseau direct, pas de cache
  if (/\.task(\?|$)/.test(url.pathname)) return;
  // tuiles carto (CARTO dark / OSM) : réseau direct (évite de saturer le cache pendant une course)
  if (url.hostname === 'tile.openstreetmap.org' || url.hostname.endsWith('basemaps.cartocdn.com')) return;

  // on ne met en cache que les réponses saines (jamais un 404/500 transitoire) ;
  // les réponses opaques (no-cors, ex. Google Fonts) restent cachables pour l'offline
  const cachePut = (key, r) => { if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(key, cp)); } return r; };

  // navigation : réseau d'abord, repli cache
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req)
      .then((r) => cachePut('/', r))
      .catch(() => caches.match('/').then((m) => m || caches.match('/index.html'))));
    return;
  }
  // shell applicatif (app.js / app.css) : réseau d'abord — une mise à jour de
  // l'app doit arriver sans attendre une nouvelle version du service worker
  if (sameOrigin && (url.pathname === '/app.js' || url.pathname === '/app.css')) {
    e.respondWith(fetch(req).then((r) => cachePut(req, r)).catch(() => caches.match(req)));
    return;
  }
  // statique même origine : cache d'abord
  if (sameOrigin) {
    e.respondWith(caches.match(req).then((m) => m || fetch(req).then((r) => cachePut(req, r))));
    return;
  }
  // CDN : stale-while-revalidate
  e.respondWith(caches.match(req).then((m) => {
    const f = fetch(req).then((r) => cachePut(req, r)).catch(() => m);
    return m || f;
  }));
});
