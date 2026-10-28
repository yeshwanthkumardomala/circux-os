const CACHE = 'circux-offline-v1';
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.add('/offline.html'))));
self.addEventListener('fetch', event => { if (event.request.mode !== 'navigate') return; event.respondWith(fetch(event.request).catch(() => caches.match('/offline.html'))); });
