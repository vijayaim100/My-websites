// sw.js – Service Worker for Expense Tracker PWA

const CACHE_NAME = "expense-tracker-cache-v4";

// Add here all the core files your app needs to load the shell offline.
const STATIC_ASSETS = [
  "./",              
  "index.html",    
  "style.css",
  "App.js",
  "dexie.js",
  "buynow.html",
  "unlock.html",     
  "manifest.json",
  "icons/192.png",
  "icons/512.png",
  "icons/72.png",
  "icons/128.png",
  "icons/144.png",
  "icons/96.png",
  "icons/152.png",
  "icons/387.png",
];

// Install: pre-cache core assets and activate immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches and take control immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Allow page to request skipWaiting manually if needed
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Fetch: cache-first for same-origin requests, network fallback
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            request.url.startsWith(self.location.origin)
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }

          return networkResponse;
        })
        .catch(() => caches.match("index.html"))
    })
  );
});