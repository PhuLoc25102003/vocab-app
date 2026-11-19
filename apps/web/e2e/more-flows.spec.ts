import { spawnSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';

const stamp = Date.now();
const password = 'mat-khau-e2e-123';
const cards = [
  { term: 'cat', definition: 'con mèo' },
  { term: 'dog', definition: 'con chó' },
  { term: 'fish', definition: 'con cá' },
];
const firstTitle = `Động vật ${stamp}`;
const title = `Con vật ${stamp}`;

const visibleField = (page: Page, label: string) =>
  page.getByLabel(label, { exact: true }).filter({ visible: true });
const progress = (page: Page, done: number) =>
  expect(page.getByText(`${done}/${cards.length}`, { exact: true })).toBeVisible();
const expectScore = (page: Page, correct: number) =>
  expect(page.getByText(/^Bạn nhớ/)).toHaveText(`Bạn nhớ ${correct} trên ${cards.length} thẻ.`);

async function signUp(page: Page, name: string, email: string) {
  await page.goto('/register');
  await page.getByLabel('Tên hiển thị').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await page.waitForURL('**/login?registered=1');
  await visibleField(page, 'Email').fill(email);
  await visibleField(page, 'Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.waitForURL('**/dashboard');
  await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible();
}

async function answerChoices(page: Page) {
  for (let done = 0; done < cards.length; done += 1) {
    await progress(page, done);
    const term = await page
      .getByRole('heading', { level: 1 })
      .filter({ visible: true })
      .innerText();
    const card = cards.find((item) => item.term === term);
    await page.getByRole('button', { name: new RegExp(card?.definition ?? '') }).click();
    await expect(page.getByRole('status').getByText('Chính xác')).toBeVisible();
    await page.getByRole('button', { name: 'Câu tiếp theo' }).click();
  }
}

function makeCardsDue(setId: string) {
  const sql = `UPDATE "CardProgress" SET "dueAt" = now() - interval '1 minute'
    WHERE "cardId" IN (SELECT id FROM "Card" WHERE "setId" = '${setId}');`;
  const result = spawnSync('node', ['e2e/run-sql.mjs'], { input: sql, encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
}

test.describe.serial('quản lý bộ từ và các chế độ học', () => {
  let page: Page;
  let setPath: string;

  test.beforeAll(async ({ browser, baseURL }) => {
    page = await browser.newPage({ baseURL });
    // Máy CI không có giọng đọc, nên ghi lại từ được yêu cầu đọc.
    await page.addInitScript(() => {
      const spoken: string[] = [];
      Object.assign(window, { spokenWords: spoken });
      Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: {
          cancel: () => undefined,
          getVoices: () => [],
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          speak: ({ text }: SpeechSynthesisUtterance) => spoken.push(text),
        },
      });
    });
    await signUp(page, 'Chủ bộ từ', `e2e-owner-${stamp}@example.com`);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('tạo, sửa rồi tìm thấy bộ từ trong danh sách', async () => {
    await page.goto('/sets/new');
    await visibleField(page, 'Tên bộ từ').fill(firstTitle);
    await page.getByLabel('Ai xem được').selectOption({ label: 'Công khai' });
    await page.getByRole('button', { name: 'Thêm thẻ' }).click();
    for (const [index, { term, definition }] of cards.entries()) {
      await visibleField(page, 'Từ').nth(index).fill(term);
      await visibleField(page, 'Nghĩa').nth(index).fill(definition);
    }
    await page.getByRole('button', { name: 'Lưu bộ từ' }).click();
    await expect(page.getByRole('heading', { name: firstTitle })).toBeVisible();
    setPath = new URL(page.url()).pathname;

    await page.getByRole('link', { name: 'Sửa bộ từ' }).click();
    await page.waitForURL('**/edit');
    await visibleField(page, 'Tên bộ từ').fill(title);
    await page.getByRole('button', { name: 'Lưu bộ từ' }).filter({ visible: true }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    await page.goto('/sets');
    await page.getByRole('searchbox').fill('khong-co-bo-tu-nay');
    await page.getByRole('button', { name: 'Tìm', exact: true }).click();
    await expect(page.getByText('Không tìm thấy bộ từ phù hợp')).toBeVisible();
    await page.getByRole('searchbox').fill(title);
    await page.getByRole('button', { name: 'Tìm', exact: true }).click();
    await expect(page.getByRole('link', { name: title })).toBeVisible();
  });

  test('học Flashcard bằng bàn phím', async () => {
    await page.goto(`${setPath}/study/flashcard`);
    for (let done = 0; done < cards.length; done += 1) {
      await progress(page, done);
      await page.keyboard.press('Space');
      await expect(page.getByRole('button', { name: /^Đã nhớ/ })).toBeVisible();
      await page.keyboard.press('2');
    }
    await expectScore(page, cards.length);
  });

  test('học Nghe viết theo từ được đọc', async () => {
    await page.goto(`${setPath}/study/dictation`);
    for (let done = 0; done < cards.length; done += 1) {
      await progress(page, done);
      const word = await page.evaluate(
        () => (window as unknown as { spokenWords: string[] }).spokenWords.at(-1) ?? '',
      );
      await page.getByLabel('Nhập từ bạn nghe được').fill(word);
      await page.getByRole('button', { name: 'Kiểm tra' }).click();
      await expect(page.getByRole('status').getByText('Chính xác')).toBeVisible();
      await page.getByRole('button', { name: 'Câu tiếp theo' }).click();
    }
    await expectScore(page, cards.length);
  });

  test('học Trắc nghiệm', async () => {
    await page.goto(`${setPath}/study/mcq`);
    await answerChoices(page);
    await expectScore(page, cards.length);
  });

  test('ôn thẻ đến hạn bằng chế độ đã chọn', async () => {
    makeCardsDue(setPath.split('/').at(-1) ?? '');

    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Ôn ngay' }).click();
    await page.waitForURL('**/review');
    await page.getByLabel('Ôn bằng chế độ').selectOption({ label: 'Trắc nghiệm' });
    await page.getByRole('link', { name: `Ôn bộ từ ${title}` }).click();
    await page.waitForURL('**/study/mcq?due=1');
    await answerChoices(page);
    await expectScore(page, cards.length);

    await page.goto('/review');
    await expect(page.getByText('Hôm nay chưa có từ cần ôn')).toBeVisible();
  });

  test('người khác sao chép được, chủ xoá bộ gốc thì bản sao vẫn còn', async ({
    browser,
    baseURL,
  }) => {
    const other = await browser.newPage({ baseURL });
    await signUp(other, 'Người học khác', `e2e-other-${stamp}@example.com`);
    await other.goto('/explore');
    await other.getByRole('searchbox').fill(title);
    await other.getByRole('button', { name: 'Tìm', exact: true }).click();
    await other.getByRole('link', { name: title }).click();
    await other.getByRole('button', { name: 'Sao chép bộ từ' }).click();
    const copyTitle = `${title} (bản sao)`;
    await expect(other.getByRole('heading', { name: copyTitle })).toBeVisible();

    await page.goto(setPath);
    await page.getByRole('button', { name: 'Xoá bộ từ' }).click();
    await page
      .getByRole('group', { name: 'Xác nhận xoá' })
      .getByRole('button', { name: 'Xoá bộ từ' })
      .click();
    await page.waitForURL('**/sets');
    await page.goto(setPath);
    await expect(page.getByText('Không tìm thấy bộ từ')).toBeVisible();

    await other.reload();
    await expect(other.getByRole('heading', { name: copyTitle })).toBeVisible();
    await other.close();
  });
});
