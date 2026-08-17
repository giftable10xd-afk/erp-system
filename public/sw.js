// Service Worker بسيط: كاش لملفات الأصول الاستاتيك (خطوط/JS/CSS) بـ
// cache-first، وكاش احتياطي لصفحات اتزارت قبل كده (network-first مع fallback
// للنسخة المخزنة لو الاتصال اتقطع). النطاق محدود عمدًا — مفيش طابور offline
// لعمليات الكتابة (زي تسجيل صيانة)؛ ده محتاج تصميم إضافي (مراجعة تعارضات
// المخزون) مش متضمن في النسخة دي.

const CACHE_NAME = "erp-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // أصول استاتيك: cache-first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/fonts/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // تنقل بين الصفحات: network-first مع fallback لنسخة مخزنة لو مفيش اتصال
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
