// SOLENE service worker.
// v3: corrige bug que servia CSS/JS quebrado (404) em cache para sempre,
// deixando a página sem estilo. Agora:
//  - nunca faz cache de respostas com erro (só res.ok);
//  - nunca faz cache do HTML de navegação (evita "casca" antiga apontando
//    para assets que não existem mais após um deploy);
//  - só faz cache dos assets content-hashed do Next (/_next/static/),
//    que são imutáveis e seguros para cache-first.
// O nome do cache foi incrementado, então o "activate" limpa automaticamente
// qualquer cache antigo/poluído de quem já visitou o site.
const CACHE = "solene-v3";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Navegações (documentos HTML): sempre pela rede, sem cache.
  // Isso impede servir uma versão antiga da página que referencia
  // arquivos CSS/JS que não existem mais.
  if (request.mode === "navigate") return;

  const url = new URL(request.url);

  // Cache-first apenas para assets imutáveis do Next (content-hashed).
  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            // Só guarda em cache respostas válidas — nunca 404/erros.
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
            }
            return res;
          }),
      ),
    );
  }
});
