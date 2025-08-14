
// v4 service worker: network-first for app shell so updates reach phones
const CACHE = 'siege-viewer-v4';
const SHELL = [
  './',
  './index.html',
  './assets/styles.v4.css',
  './assets/app.v4.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Always network-first for HTML/CSS/JS so phones get updates
  const isAppShell = url.pathname.endsWith('/') || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
  if (isAppShell) {
    event.respondWith(
      fetch(event.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(event.request, copy));
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  // For everything else (e.g., icons), cache-first
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
