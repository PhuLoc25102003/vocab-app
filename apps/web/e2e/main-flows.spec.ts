import { expect, test, type Page } from '@playwright/test';

const stamp = Date.now();
const account = {
  name: 'Học sinh E2E',
  email: `e2e-${stamp}@example.com`,
  password: 'mat-khau-e2e-123',
};
const setTitle = `Trái cây ${stamp}`;
const cards = [
  { term: 'apple', definition: 'quả táo' },
  { term: 'banana', definition: 'quả chuối' },
];

async function logIn(page: Page) {
  // Next giữ trang đăng ký ở trạng thái ẩn nên phải lọc ô đang hiện.
  await page.getByLabel('Email').filter({ visible: true }).fill(account.email);
  await page
    .getByLabel('Mật khẩu', { exact: true })
    .filter({ visible: true })
    .fill(account.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
}

async function currentCard(page: Page) {
  await expect(page.getByRole('button', { name: 'Kiểm tra' })).toBeVisible();
  for (const card of cards) {
    const prompt = page.getByText(card.definition, { exact: true }).filter({ visible: true });
    if ((await prompt.count()) > 0) {
      return card;
    }
  }
  throw new Error('Không thấy nghĩa của thẻ đang học');
}

async function submitWrittenAnswer(page: Page, answer: string, feedback: string) {
  await page.getByLabel('Nhập từ').fill(answer);
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await expect(page.getByRole('status').getByText(feedback)).toBeVisible();
  await page.getByRole('button', { name: 'Câu tiếp theo' }).click();
}

test.describe.serial('luồng chính', () => {
  let page: Page;
  let setPath: string;
  let wrongTerm: string;

  test.beforeAll(async ({ browser, baseURL }) => {
    page = await browser.newPage({ baseURL });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('đăng ký từ trang giới thiệu rồi tạo bộ từ công khai', async () => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Tạo tài khoản' }).first().click();

    await page.getByLabel('Tên hiển thị').fill(account.name);
    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await page.waitForURL('**/login?registered=1');
    await logIn(page);
    await page.waitForURL('**/dashboard');

    await page.goto('/sets/new');
    await page.getByLabel('Tên bộ từ').fill(setTitle);
    await page.getByLabel('Ai xem được').selectOption({ label: 'Công khai' });
    for (const [index, { term, definition }] of cards.entries()) {
      await page.getByLabel('Từ', { exact: true }).nth(index).fill(term);
      await page.getByLabel('Nghĩa', { exact: true }).nth(index).fill(definition);
    }
    await page.getByRole('button', { name: 'Lưu bộ từ' }).click();

    await expect(page.getByRole('heading', { name: setTitle })).toBeVisible();
    setPath = new URL(page.url()).pathname;
  });

  test('học chế độ Viết, xem kết quả và thống kê', async () => {
    await page.getByRole('link', { name: 'Luyện viết' }).click();

    const first = await currentCard(page);
    await submitWrittenAnswer(page, first.term, 'Chính xác');
    const second = await currentCard(page);
    wrongTerm = second.term;
    await submitWrittenAnswer(page, 'sai', 'Chưa đúng');

    await expect(page.getByRole('heading', { name: 'Đã xong phiên học' })).toBeVisible();
    await expect(page.getByText(/^Bạn nhớ/)).toHaveText('Bạn nhớ 1 trên 2 thẻ.');

    await page.goto('/dashboard');
    await expect(page.getByText('Câu trả lời hôm nay')).toBeVisible();
    await expect(page.getByRole('link', { name: wrongTerm })).toBeVisible();
    await expect(page.getByText('Sai 1 lần')).toBeVisible();
  });

  test('khách học thử bộ từ công khai mà không lưu tiến độ', async ({ browser, baseURL }) => {
    const guest = await browser.newPage({ baseURL });
    const studyRequests: string[] = [];
    guest.on('request', (request) => {
      if (request.method() !== 'GET' && request.url().includes('/api/v1/study')) {
        studyRequests.push(request.url());
      }
    });

    await guest.goto(`/public${setPath}`);
    await expect(guest.getByRole('heading', { name: setTitle })).toBeVisible();
    await guest.getByRole('link', { name: 'Học thử' }).click();
    for (let index = 0; index < cards.length; index += 1) {
      await guest.getByRole('button', { name: /^Xem nghĩa/ }).click();
      await guest.getByRole('button', { name: /^Đã nhớ/ }).click();
    }

    await expect(guest.getByText(/^Bạn nhớ/)).toHaveText('Bạn nhớ 2 trên 2 thẻ.');
    expect(studyRequests).toEqual([]);
    await guest.close();
  });

  test('đăng xuất, bị chặn ở trang riêng, đăng nhập lại đúng trang', async () => {
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/dashboard'));

    await page.goto(setPath);
    await page.waitForURL('**/login?next=*');
    await logIn(page);

    await page.waitForURL(`**${setPath}`);
    await expect(page.getByRole('heading', { name: setTitle })).toBeVisible();
  });
});
