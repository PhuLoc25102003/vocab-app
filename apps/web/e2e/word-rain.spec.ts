import { spawnSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';
import { AUDIT_VIEWS, applyAuditView, auditPage } from './audit';

const stamp = Date.now();
const password = 'mat-khau-e2e-123';
const email = `e2e-rain-${stamp}@example.com`;
const setId = `e2e-rain-set-${stamp}`;
// Chữ đầu khác nhau để gõ chữ đầu luôn khoá đúng mục tiêu.
const cards = [
  { term: 'cat', definition: 'con mèo' },
  { term: 'dog', definition: 'con chó' },
  { term: 'fish', definition: 'con cá' },
  { term: 'bird', definition: 'con chim' },
];

const visibleField = (page: Page, label: string) =>
  page.getByLabel(label, { exact: true }).filter({ visible: true });

function sql(input: string) {
  const result = spawnSync('node', ['e2e/run-sql.mjs'], { input, encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
}

test('chơi Mưa từ bằng bàn phím đến khi bắn hạ hết, xem kết quả và kỷ lục', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/register');
  await page.getByLabel('Tên hiển thị').fill('Phi công');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await page.waitForURL('**/login?registered=1');
  await visibleField(page, 'Email').fill(email);
  await visibleField(page, 'Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.waitForURL('**/dashboard');
  sql(`
    INSERT INTO "StudySet" (id, "ownerId", title, visibility, "cardCount", "updatedAt")
      SELECT '${setId}', id, 'Con vật ${stamp}', 'PRIVATE', ${cards.length}, now()
      FROM "User" WHERE email = '${email}';
    INSERT INTO "Card" (id, "setId", position, term, definition, "updatedAt") VALUES
      ${cards.map((card, index) => `('e2e-rain-card-${stamp}-${index}', '${setId}', ${index}, '${card.term}', '${card.definition}', now())`).join(',\n      ')};
  `);

  // Màn bắt đầu đạt accessibility ở light, dark và 360 px.
  const issues: string[] = [];
  for (const view of AUDIT_VIEWS) {
    await applyAuditView(page, view);
    await page.goto(`/sets/${setId}/study/word_rain`);
    await expect(page.getByRole('heading', { name: 'Mưa từ' })).toBeVisible();
    issues.push(...(await auditPage(page, `${view.name} Mưa từ`)));
  }
  expect([...new Set(issues)]).toEqual([]);

  await expect(page.getByRole('radio', { name: /Gõ/ })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  const input = page.getByLabel('Gõ từ tiếng Anh');
  await expect(input).toBeFocused();

  // Gõ lần lượt mọi từ cho tới khi bắn hạ hết; từ chưa rơi thì gõ sai, không sao.
  const won = page.getByRole('heading', { name: 'Bạn đã bắn hạ hết!' });
  for (let round = 0; round < 120 && !(await won.isVisible()); round += 1) {
    for (const { term } of cards) {
      if (await won.isVisible()) break;
      await input.pressSequentially(term);
    }
    await page.waitForTimeout(400);
  }
  await expect(won).toBeVisible();
  await expect(page.getByText('Kỷ lục mới!')).toBeVisible();

  await page.getByRole('button', { name: 'Xem kết quả' }).click();
  await expect(page.getByRole('heading', { name: 'Đã xong phiên học' })).toBeVisible();
  await expect(page.getByText(/^\+\d+ XP$/)).toBeVisible();

  // Màn bắt đầu của ván sau hiện kỷ lục vừa lập.
  await page.goto(`/sets/${setId}/study/word_rain`);
  await expect(page.getByText(/^Kỷ lục \d+$/)).toBeVisible();
});
