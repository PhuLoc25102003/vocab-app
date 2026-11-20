/* Service worker của Nhớ Từ: lưu tạm tài nguyên tĩnh, mất mạng thì hiện trang /offline.
   Không bao giờ lưu dữ liệu API hay trang có dữ liệu người dùng. */
const VERSION = 'v2';
const STATIC_CACHE = `static-${VERSION}`;
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(async (cache) => {
        // Lưu cả trang offline lẫn mã của nó, để trang chạy được khi mất mạng thật.
        const response = await fetch(OFFLINE_URL, { cache: 'reload' });
        const html = await response.clone().text();
        await cache.put(OFFLINE_URL, response);
        const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)]+/g) ?? [])];
        await cache.addAll(assets);
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/pwa-icon/');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (isStaticAsset(url)) {
    // Tên file tĩnh có mã băm nên lấy từ bộ nhớ trước là an toàn.
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  if (request.mode === 'navigate') {
    // Trang luôn lấy mới từ mạng, chỉ khi mất mạng mới hiện trang offline.
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
  }
});
