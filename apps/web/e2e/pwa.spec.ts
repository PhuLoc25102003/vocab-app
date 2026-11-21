import { expect, test } from '@playwright/test';

test('cài được như ứng dụng và hiện trang offline khi mất mạng', async ({
  page,
  context,
  request,
}) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest).toMatchObject({ display: 'standalone', start_url: '/dashboard' });

  const icon = await request.get('/pwa-icon/192');
  expect(icon.status()).toBe(200);
  expect(icon.headers()['content-type']).toContain('image/png');
  expect((await request.get('/pwa-icon/100')).status()).toBe(404);

  await page.goto('/');
  // Đợi service worker nhận quyền điều khiển trang rồi mới thử mất mạng.
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);

  await context.setOffline(true);
  await page.goto('/public/explore').catch(() => undefined);
  await expect(page.getByRole('heading', { name: 'Bạn đang offline' })).toBeVisible();
  await context.setOffline(false);
});

test('học Flashcard khi mất mạng với bộ đã tải, kết quả vào hàng đợi', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  // Nạp sẵn một bộ đã tải về máy, giống khi bấm "Tải về máy".
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('vocab-offline', 2);
        request.onupgradeneeded = () => {
          request.result.createObjectStore('sets', { keyPath: 'set.id' });
          request.result.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
        };
        request.onsuccess = () => {
          const tx = request.result.transaction('sets', 'readwrite');
          tx.objectStore('sets').put({
            savedAt: new Date().toISOString(),
            set: {
              id: 'offline-set',
              title: 'Bộ offline',
              termLang: 'en',
              defLang: 'vi',
              cards: [
                { id: 'c1', term: 'cat', definition: 'con mèo' },
                { id: 'c2', term: 'dog', definition: 'con chó' },
              ],
            },
          });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
  );

  await context.setOffline(true);
  await page.goto('/offline').catch(() => undefined);
  await page.getByText('Bộ offline').click();
  await page.getByRole('button', { name: 'Học offline' }).click();
  for (let index = 0; index < 2; index += 1) {
    await page.getByRole('button', { name: /^Xem nghĩa/ }).click();
    await page.getByRole('button', { name: /^Đã nhớ/ }).click();
  }
  await expect(page.getByText('Kết quả đã lưu trên máy')).toBeVisible();
  const pending = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const request = indexedDB.open('vocab-offline', 2);
        request.onsuccess = () => {
          const count = request.result.transaction('pending').objectStore('pending').count();
          count.onsuccess = () => resolve(count.result);
        };
      }),
  );
  expect(pending).toBe(1);
  await context.setOffline(false);
});
