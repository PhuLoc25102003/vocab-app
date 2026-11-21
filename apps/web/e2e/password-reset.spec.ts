import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { AUDIT_VIEWS, applyAuditView, auditPage } from './audit';

const stamp = Date.now();
const email = `e2e-quen-${stamp}@example.com`;
const oldPassword = 'mat-khau-cu-123';
const newPassword = 'mat-khau-moi-456';
// Bộ gửi thư trong bộ nhớ nằm trong tiến trình API, E2E ghi thẳng hash của một token biết trước.
const token = `e2e${stamp}`.padEnd(43, 'x');
const tokenHash = createHash('sha256').update(token).digest('base64url');

function sql(input: string) {
  const result = spawnSync('node', ['e2e/run-sql.mjs'], { input, encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
}

test('quên mật khẩu: xin liên kết, đặt mật khẩu mới, đăng nhập lại, liên kết không dùng lại được', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto('/register');
  await page.getByLabel('Tên hiển thị').fill('Quên Mật Khẩu');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(oldPassword);
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await page.waitForURL('**/login?registered=1');

  await page.getByRole('link', { name: 'Quên mật khẩu?' }).click();
  await page.waitForURL('**/forgot-password');
  await page.getByLabel('Email').filter({ visible: true }).fill(email);
  await page.getByRole('button', { name: 'Gửi liên kết' }).click();
  await expect(page.getByRole('status')).toContainText('Nếu email này có tài khoản');

  sql(`
    INSERT INTO "PasswordResetToken" (id, "userId", "tokenHash", "expiresAt")
      SELECT 'e2e-reset-${stamp}', id, '${tokenHash}', now() + interval '30 minutes'
      FROM "User" WHERE email = '${email}';
  `);

  // Trang đặt mật khẩu và trang xin liên kết đạt accessibility ở light và dark 360 px.
  const issues: string[] = [];
  for (const view of AUDIT_VIEWS) {
    await applyAuditView(page, view);
    await page.goto('/forgot-password');
    issues.push(...(await auditPage(page, `${view.name} /forgot-password`)));
    await page.goto(`/reset-password?token=${token}`);
    await expect(page.getByLabel('Mật khẩu mới')).toBeVisible();
    issues.push(...(await auditPage(page, `${view.name} /reset-password`)));
  }
  expect([...new Set(issues)]).toEqual([]);

  await page.goto(`/reset-password?token=${token}`);
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.getByLabel('Mật khẩu mới').fill(newPassword);
  await page.getByRole('button', { name: 'Đặt mật khẩu mới' }).click();
  await page.waitForURL('**/login?reset=1');
  await expect(page.getByText('Đã đặt mật khẩu mới.')).toBeVisible();

  await page.getByLabel('Email').filter({ visible: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).filter({ visible: true }).fill(newPassword);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.waitForURL('**/dashboard');

  // Liên kết đã dùng thì mời xin liên kết mới.
  await page.goto(`/reset-password?token=${token}`);
  await page.getByLabel('Mật khẩu mới').fill('mat-khau-khac-789');
  await page.getByRole('button', { name: 'Đặt mật khẩu mới' }).click();
  await expect(
    page.getByText('Liên kết đã hết hạn hoặc đã được dùng.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Gửi liên kết mới' })).toBeVisible();
});
