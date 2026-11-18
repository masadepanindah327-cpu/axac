// Network-first: selalu ambil versi terbaru kalau online, jatuh ke cache kalau offline.
var C = 'axac-v2', F = ['./', 'index.html', 'style.css', 'app.js', 'games.js', 'logo-128.png', 'logo-192.png', 'logo-512.png', 'manifest.webmanifest', 'assets/bg-hands.jpg', 'assets/bg-forest.jpg', 'assets/bg-cathedral.jpg', 'assets/w-trust.jpg', 'assets/w-moon-dark.jpg', 'assets/w-angel.jpg', 'assets/w-moon-light.jpg', 'assets/w-sword.jpg', 'assets/w-tulip.jpg', 'assets/banner-eyes.jpg'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(C).then(function (c) { return c.addAll(F); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (n) { return n !== C; }).map(function (n) { return caches.delete(n); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) { var cp = r.clone(); caches.open(C).then(function (c) { c.put(e.request, cp); }); return r; }).catch(function () { return caches.match(e.request); }));
});
