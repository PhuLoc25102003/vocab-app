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

    await page.goto('/sets');
    await page.getByRole('link', { name: 'Tạo bộ từ' }).filter({ visible: true }).first().click();
    await page.waitForURL('**/sets/new');
    const titleField = page.getByLabel('Tên bộ từ').filter({ visible: true });
    await titleField.fill(setTitle);

    // Từ chối rời trang thì vẫn ở lại và giữ dữ liệu đã nhập.
    page.once('dialog', (dialog) => void dialog.dismiss());
    await page.getByRole('link', { name: 'Quay lại danh sách' }).click();
    page.once('dialog', (dialog) => void dialog.dismiss());
    await page.evaluate(() => window.history.back());
    await expect(titleField).toHaveValue(setTitle);
    expect(new URL(page.url()).pathname).toBe('/sets/new');

    await page.getByLabel('Ai xem được').selectOption({ label: 'Công khai' });
    for (const [index, { term, definition }] of cards.entries()) {
      await page.getByLabel('Từ', { exact: true }).nth(index).fill(term);
      await page.getByLabel('Nghĩa', { exact: true }).nth(index).fill(definition);
    }
    await page.getByRole('button', { name: 'Lưu bộ từ' }).click();

    await expect(page.getByRole('heading', { name: setTitle })).toBeVisible();
    setPath = new URL(page.url()).pathname;

    // Đã lưu thì nút quay lại của trình duyệt không mở lại form.
    await page.goBack();
    await page.waitForURL('**/sets');
    await page.goForward();
    await expect(page.getByRole('heading', { name: setTitle })).toBeVisible();

    // Đồng ý rời trang thì về trang trước và bỏ thay đổi.
    await page.getByRole('link', { name: 'Sửa bộ từ' }).click();
    await page.waitForURL('**/edit');
    await titleField.fill('Tên chưa lưu');
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('link', { name: 'Quay lại bộ từ' }).click();
    await page.waitForURL(`**${setPath}`);
    await expect(page.getByRole('heading', { name: setTitle })).toBeVisible();
  });

  test('học chế độ Viết, xem kết quả và thống kê', async () => {
    await page.getByRole('link', { name: 'Luyện viết' }).click();

    const first = await currentCard(page);
    await submitWrittenAnswer(page, first.term, 'Chính xác');

    // Tải lại trang vẫn ở đúng câu và không mất đáp án đã trả lời.
    await expect(page.getByText('1/2', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText('1/2', { exact: true })).toBeVisible();

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

    await guest.goto('/');
    await guest.getByRole('link', { name: 'Khám phá bộ từ' }).click();
    await guest.waitForURL('**/public/explore');
    await guest.getByRole('searchbox', { name: 'Tìm bộ từ theo tên' }).fill(setTitle);
    await guest.getByRole('button', { name: 'Tìm', exact: true }).click();
    await guest.getByRole('link', { name: setTitle }).click();
    await guest.waitForURL(`**/public${setPath}`);
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

  test('đường dẫn sai có trang 404 tiếng Việt và lối về', async () => {
    const response = await page.goto('/duong-dan-khong-co');

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
    await page.getByRole('link', { name: 'Về trang của tôi' }).click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible();
  });

  test('đổi tên và mật khẩu ở trang tài khoản', async () => {
    await page.getByRole('link', { name: 'Tài khoản' }).click();
    await page.waitForURL('**/account');
    await expect(page.getByText(account.email)).toBeVisible();

    await page.getByLabel('Tên hiển thị').fill('Tên mới E2E');
    await page.getByRole('button', { name: 'Lưu tên' }).click();
    await expect(page.getByText('Đã lưu tên hiển thị')).toBeVisible();

    await page.getByLabel('Mật khẩu hiện tại', { exact: true }).fill(account.password);
    account.password = 'mat-khau-moi-e2e-456';
    await page.getByLabel('Mật khẩu mới', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Đổi mật khẩu' }).click();
    await expect(page.getByText(/^Đã đổi mật khẩu/)).toBeVisible();
  });

  test('đăng xuất, bị chặn ở trang riêng, đăng nhập lại đúng trang', async () => {
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/dashboard'));

    await page.goto(setPath);
    await page.waitForURL('**/login?next=*');
    await logIn(page);

    await page.waitForURL(`**${setPath}`);
    await expect(page.getByRole('heading', { name: setTitle })).toBeVisible();
  });

  test('xoá tài khoản rồi không đăng nhập lại được', async () => {
    await page.goto('/account');
    await page.getByRole('button', { name: 'Xoá tài khoản' }).click();
    await page.getByLabel('Nhập mật khẩu để xác nhận', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Xoá vĩnh viễn' }).click();
    await page.waitForURL('**/login');

    await logIn(page);
    await expect(page.getByRole('alert').filter({ hasText: 'không đúng' })).toBeVisible();
  });
});
