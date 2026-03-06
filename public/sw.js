// La Commune POS — Service Worker
const CACHE_NAME = "lc-pos-v1";
const STATIC_ASSETS = [
  "/",
  "/mesas",
  "/manifest.json",
];

// Install — cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Skip non-GET and API requests
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-actions") {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  // Notify the client to process the offline queue
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: "SYNC_OFFLINE_QUEUE" });
  });
}
