const CACHE_PREFIX = "kikis-pizza-";
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const OFFLINE_PAGE = "/offline.html";
const OFFLINE_ASSETS = [
  OFFLINE_PAGE,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(OFFLINE_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin ||
      url.pathname.startsWith("/.netlify/")) return;

  // Keep menus, account pages and authentication responses out of the cache.
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return await cache.match(OFFLINE_PAGE) || Response.error();
      }
    })());
  } else if (OFFLINE_ASSETS.includes(url.pathname) && !url.search) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(url.pathname) || fetch(request);
    })());
  }
});
