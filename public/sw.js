// La Commune POS — Service Worker v3
const CACHE_VERSION = 3;
const STATIC_CACHE = `lc-pos-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `lc-pos-dynamic-v${CACHE_VERSION}`;
const MAX_DYNAMIC_ITEMS = 50;

// Rutas de la app que se pre-cachean al instalar
const APP_SHELL = [
  "/",
  "/mesas",
  "/ordenes",
  "/kds",
  "/menu",
  "/cobros",
  "/reportes",
  "/usuarios",
  "/fidelidad",
  "/manifest.json",
];

// Patrones de URLs que NUNCA se cachean
const NEVER_CACHE_PATTERNS = [
  /\/api\//,
  /supabase\.(co|in)/,
  /chrome-extension:\/\//,
  /localhost:\d+\/api/,
];

function shouldNeverCache(url) {
  return NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url));
}

// ── Install — cache app shell con tolerancia a errores ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.allSettled(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] No se pudo cachear ${url}:`, err.message);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

// ── Activate — limpiar caches antiguos ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch — estrategia por tipo de recurso ──
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ignorar non-GET
  if (request.method !== "GET") return;

  // Ignorar recursos que no se cachean
  if (shouldNeverCache(request.url)) return;

  // Navegación (páginas HTML): Network first → cache → offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Assets estáticos (JS, CSS, fonts, imágenes): Cache first → network
  const url = new URL(request.url);
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Todo lo demás: Network first → cache dinámico (solo cachear respuestas OK)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.status < 400) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
            // Limitar tamaño del cache dinámico
            cache.keys().then((keys) => {
              if (keys.length > MAX_DYNAMIC_ITEMS) {
                cache.delete(keys[0]);
              }
            });
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ── Background Sync ──
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-actions") {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  const allClients = await self.clients.matchAll();
  allClients.forEach((client) => {
    client.postMessage({ type: "SYNC_OFFLINE_QUEUE" });
  });
}

// ── Mensajes del cliente ──
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
