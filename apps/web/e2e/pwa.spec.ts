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
