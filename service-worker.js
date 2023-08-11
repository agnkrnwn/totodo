const CACHE_NAME = 'todo-app-cache-v1';
const urlsToCache = ['/', 'index.html', 'app.js', 'styles.css', 'icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
      .catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});
