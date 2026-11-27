/* Service worker của Nhớ Từ: lưu tạm tài nguyên tĩnh, mất mạng thì hiện trang /offline.
   Không bao giờ lưu dữ liệu API hay trang có dữ liệu người dùng. */
const VERSION = 'v3';
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

/* Web Push (việc 7.8). Máy chủ chỉ gửi { type, data, href }, câu chữ dựng ở đây theo ngôn ngữ
   người dùng chọn (cookie vocab.locale), không có thì theo ngôn ngữ của trình duyệt. */
const PUSH_TEXT = {
  vi: {
    title: 'Nhớ Từ',
    ASSIGNMENT_NEW: (d) => `Bài tập mới ở lớp ${d.className}: ${d.setTitle}`,
    ASSIGNMENT_DUE: (d) => `Sắp hết hạn: ${d.setTitle}. Làm ngay để kịp nộp nhé.`,
    REVIEW_DUE: (d) =>
      d.streakDays > 0
        ? `🔥 Chuỗi ${d.streakDays} ngày sắp mất! ${d.count > 0 ? `Còn ${d.count} thẻ cần ôn.` : 'Học một phiên để giữ chuỗi.'}`
        : `Đến giờ ôn tập: ${d.count} thẻ đang chờ bạn.`,
  },
  en: {
    title: 'Nhớ Từ',
    ASSIGNMENT_NEW: (d) => `New assignment in ${d.className}: ${d.setTitle}`,
    ASSIGNMENT_DUE: (d) => `Due soon: ${d.setTitle}. Finish it in time.`,
    REVIEW_DUE: (d) =>
      d.streakDays > 0
        ? `🔥 Your ${d.streakDays}-day streak is about to end! ${d.count > 0 ? `${d.count} cards to review.` : 'Study one session to keep it.'}`
        : `Time to review: ${d.count} cards are waiting.`,
  },
};

async function pushLocale() {
  try {
    const cookie = self.cookieStore ? await self.cookieStore.get('vocab.locale') : null;
    if (cookie && (cookie.value === 'vi' || cookie.value === 'en')) return cookie.value;
  } catch {
    // cookieStore không có ở mọi trình duyệt.
  }
  return (self.navigator.language || 'vi').toLowerCase().startsWith('vi') ? 'vi' : 'en';
}

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let payload;
      try {
        payload = event.data ? event.data.json() : null;
      } catch {
        payload = null;
      }
      const text = PUSH_TEXT[await pushLocale()];
      const render = payload && text[payload.type];
      await self.registration.showNotification(text.title, {
        body: render ? render(payload.data || {}) : '',
        icon: '/pwa-icon/192',
        badge: '/pwa-icon/192',
        // Cùng loại thì thay thông báo cũ, không chồng nhiều cái.
        tag: payload ? payload.type : 'vocab',
        data: { href: (payload && payload.href) || '/dashboard' },
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const href = new URL(event.notification.data?.href || '/dashboard', self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const open = windows.find((client) => client.url.startsWith(self.location.origin));
      if (open) {
        await open.focus();
        return open.navigate(href);
      }
      return self.clients.openWindow(href);
    })(),
  );
});
