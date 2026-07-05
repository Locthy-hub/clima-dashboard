/* Service worker mínimo — cacheia o "shell" estático do app para uso offline.
   As chamadas de API (clima, geocoding, mapa) continuam sempre buscando a rede,
   já que são dados que mudam a todo momento. */

const CACHE_NAME = "clima-shell-v1";
const SHELL_FILES = ["./index.html", "./css/style.css", "./js/script.js", "./manifest.json", "./icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Só serve do cache o "shell" do próprio app; tudo externo (APIs, mapa) vai direto pra rede.
  if (!isSameOrigin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
