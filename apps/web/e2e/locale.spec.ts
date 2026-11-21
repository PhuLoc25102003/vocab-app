import { expect, test } from '@playwright/test';
import { applyAuditView, auditPage, AUDIT_VIEWS } from './audit';

test('đổi ngôn ngữ giữa tiếng Việt và tiếng Anh, nhớ lựa chọn và đạt accessibility', async ({
  page,
}) => {
  await page.goto('/');

  // 1. Mặc định là tiếng Việt
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(page.getByRole('button', { name: /đổi sang tiếng Anh/i })).toBeVisible();

  // 2. Chuyển sang tiếng Anh
  await page.getByRole('button', { name: /đổi sang tiếng Anh/i }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: /switch to Vietnamese/i })).toBeVisible();

  // 3. Tải lại trang vẫn giữ tiếng Anh
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: /switch to Vietnamese/i })).toBeVisible();

  // 4. Kiểm tra accessibility ở cả hai ngôn ngữ
  for (const view of AUDIT_VIEWS) {
    await applyAuditView(page, view);
    const enIssues = await auditPage(page, `landing en ${view.name}`);
    expect(enIssues).toEqual([]);
  }

  // 5. Đổi lại tiếng Việt
  await page.getByRole('button', { name: /switch to Vietnamese/i }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(page.getByRole('button', { name: /đổi sang tiếng Anh/i })).toBeVisible();

  for (const view of AUDIT_VIEWS) {
    await applyAuditView(page, view);
    const viIssues = await auditPage(page, `landing vi ${view.name}`);
    expect(viIssues).toEqual([]);
  }
});
