import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { buildXlsx } from '../src/lib/xlsx';
import { AUDIT_VIEWS, auditFocus, auditPage, applyAuditView } from './audit';

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
    page = await (await browser.newContext({ baseURL })).newPage();
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
    await page.context().close();
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

  test('học kỹ: trả lời sai thì được hỏi lại trong vòng, học đến hết', async () => {
    await page.goto(`${setPath}/study/learn`);
    const result = page.getByText(/^Bạn nhớ/);
    const answerBox = page.getByLabel('Nhập từ');
    let answered = 0;
    let sawRetry = false;
    while (answered < 20 && !(await result.isVisible())) {
      await expect(
        answerBox
          .or(page.getByRole('heading', { level: 1 }))
          .or(result)
          .first(),
      ).toBeVisible();
      if (await result.isVisible()) break;
      sawRetry ||= await page.getByText('Hỏi lại câu trả lời sai').isVisible();
      // Câu đầu tiên cố ý trả lời sai để câu đó được hỏi lại.
      const correct = answered > 0;
      if (await answerBox.isVisible()) {
        const prompt = await page.locator('p[lang="vi"]').first().innerText();
        const card = cards.find(({ definition }) => definition === prompt);
        await answerBox.fill(correct ? (card?.term ?? '') : 'sai');
        await page.getByRole('button', { name: 'Kiểm tra' }).click();
      } else {
        const term = await page.getByRole('heading', { level: 1 }).innerText();
        const card = cards.find((item) => item.term === term);
        const other = cards.find((item) => item !== card);
        const pick = correct ? card?.definition : other?.definition;
        await page.getByRole('button', { name: new RegExp(pick ?? '') }).click();
      }
      await page.getByRole('button', { name: 'Câu tiếp theo' }).click();
      answered += 1;
    }
    expect(sawRetry).toBe(true);
    await expect(result).toHaveText(`Bạn nhớ ${cards.length - 1} trên ${cards.length} thẻ.`);
  });

  test('ghép cặp từ với nghĩa', async () => {
    await page.goto(`${setPath}/study/match`);
    const terms = page.getByRole('list', { name: 'Từ' });
    const meanings = page.getByRole('list', { name: 'Nghĩa' });
    for (const { term, definition } of cards) {
      await terms.getByRole('button', { name: term, exact: true }).click();
      await meanings.getByRole('button', { name: definition, exact: true }).click();
    }
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
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

  test('nhập CSV, sửa dòng lỗi, lưu rồi nhập thêm vào bộ có sẵn', async () => {
    const importTitle = `Nhập CSV ${stamp}`;
    await page.goto('/sets');
    await page.getByRole('link', { name: 'Nhập từ file' }).click();
    await page.waitForURL('**/sets/import');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'tu-vung.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('\uFEFFTừ,Nghĩa\nbird,"con chim, chim"\nlion,\n', 'utf8'),
    });
    await expect(page.getByText('Đã đọc tu-vung.csv')).toBeVisible();
    await page.getByLabel('Dòng đầu là tiêu đề, bỏ qua khi nhập').check();
    await page.getByRole('button', { name: 'Xem trước' }).click();

    const errorRow = page.getByRole('listitem', { name: 'Dòng 3' });
    await expect(errorRow.getByText('Hãy nhập định nghĩa')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lưu 2 thẻ' })).toBeDisabled();
    await errorRow.getByLabel('Nghĩa').fill('sư tử');
    await page.getByLabel('Tên bộ từ mới').fill(importTitle);
    await page.getByRole('button', { name: 'Lưu 2 thẻ' }).click();

    await expect(page.getByRole('heading', { name: importTitle })).toBeVisible();
    await expect(page.getByText('con chim, chim')).toBeVisible();
    const importPath = new URL(page.url()).pathname;

    // File Excel đi qua worker `blob:`, nên bước này kiểm tra luôn CSP của bản production.
    await page.getByRole('link', { name: 'Nhập thêm thẻ' }).click();
    await expect(page.getByText(/bộ đang có 2 thẻ/)).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'tu-them.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(buildXlsx([[['tiger', 'con hổ', '/ˈtaɪ.ɡər/']]])),
    });
    await expect(page.getByText('Đã đọc tu-them.xlsx')).toBeVisible();
    await expect(page.getByLabel('Ký tự phân cách')).toHaveValue('tab');
    await page.getByLabel('Cột phiên âm (không bắt buộc)').selectOption('3');
    await page.getByRole('button', { name: 'Xem trước' }).click();
    await expect(page.getByLabel('Phiên âm')).toHaveValue('/ˈtaɪ.ɡər/');
    await page.getByRole('button', { name: 'Lưu 1 thẻ' }).click();
    await page.waitForURL(`**${importPath}`);
    await expect(page.getByText('con hổ')).toBeVisible();

    // Tải file mẫu rồi chọn lại chính file đó: trang nhận ra tiêu đề và chọn sẵn 4 cột.
    await page.goto('/sets/import');
    const [template] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Tải file mẫu .xlsx' }).click(),
    ]);
    expect(template.suggestedFilename()).toBe('mau-nhap-tu-vung.xlsx');
    await page.locator('input[type="file"]').setInputFiles({
      name: template.suggestedFilename(),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: await readFile(await template.path()),
    });
    await expect(page.getByText('Đã nhận ra tiêu đề file mẫu')).toBeVisible();
    await page.getByRole('button', { name: 'Xem trước' }).click();
    await expect(page.getByRole('heading', { name: 'Xem trước (3 thẻ)' })).toBeVisible();
    await expect(page.getByLabel('Phiên âm').first()).toHaveValue('/ˈæp.əl/');
    await expect(page.getByLabel('Ví dụ').first()).toHaveValue('I eat an apple every day.');
  });

  test('tạo thư mục, chuyển bộ vào, lọc rồi xoá thư mục mà bộ vẫn còn', async () => {
    const folderName = `Lớp 10 ${stamp}`;
    await page.goto('/sets');
    await page.getByText('Quản lý thư mục').click();
    await page.getByLabel('Tên thư mục mới').fill(folderName);
    await page.getByRole('button', { name: 'Tạo thư mục' }).click();
    await expect(page.getByText(`${folderName} (0 bộ)`)).toBeVisible();

    await page.goto(setPath);
    await page.getByLabel('Thư mục', { exact: true }).selectOption({ label: folderName });
    await expect(page.getByText('Đã chuyển thư mục')).toBeVisible();

    await page.goto('/sets');
    await page.getByLabel('Thư mục', { exact: true }).selectOption({ label: `${folderName} (1)` });
    await page.waitForURL('**/sets?folder=*');
    await expect(page.getByRole('link', { name: title })).toBeVisible();
    await expect(page.getByRole('link', { name: `Nhập CSV ${stamp}` })).toHaveCount(0);

    await page.getByText('Quản lý thư mục').click();
    await page.getByRole('button', { name: `Xoá ${folderName}` }).click();
    await page.getByRole('button', { name: 'Xoá thư mục' }).click();
    await expect(page.getByText('Đã xoá thư mục, bộ từ vẫn được giữ')).toBeVisible();
    await page.goto('/sets');
    await expect(page.getByRole('link', { name: title })).toBeVisible();
  });

  test('mọi màn hình đạt accessibility ở light và dark 360 px', async ({ browser, baseURL }) => {
    test.setTimeout(240_000);
    const guest = await (await browser.newContext({ baseURL })).newPage();
    const memberPaths = [
      '/dashboard',
      '/sets',
      '/sets/new',
      '/sets/import',
      setPath,
      `${setPath}/edit`,
      '/explore',
      '/review',
      '/account',
      `${setPath}/study/flashcard`,
      `${setPath}/study/learn`,
      `${setPath}/study/write`,
      `${setPath}/study/dictation`,
      `${setPath}/study/mcq`,
      `${setPath}/study/cloze`,
      `${setPath}/study/match`,
    ];
    const guestPaths = [
      '/',
      '/login',
      '/register',
      '/public/explore',
      `/public${setPath}`,
      `/public${setPath}/study/flashcard`,
      '/khong-co-trang-nay',
    ];
    const issues: string[] = [];

    for (const view of AUDIT_VIEWS) {
      await applyAuditView(page, view);
      await applyAuditView(guest, view);
      for (const [viewer, paths] of [
        [page, memberPaths],
        [guest, guestPaths],
      ] as const) {
        for (const path of paths) {
          await viewer.goto(path);
          const label = `${view.name} ${path.replace(setPath, '/sets/:id')}`;
          issues.push(...(await auditPage(viewer, label)));
          if (view.colorScheme === 'light') {
            issues.push(...(await auditFocus(viewer, label)));
          }
        }
      }

      await page.goto(`${setPath}/study/flashcard`);
      const flip = page.getByRole('button', { name: /^Xem nghĩa/ });
      await flip.click();
      issues.push(...(await auditPage(page, `${view.name} mặt sau thẻ`)));
      const known = page.getByRole('button', { name: /^Đã nhớ/ });
      await known.click();
      const result = page.getByRole('heading', { name: 'Đã xong phiên học' });
      while (!(await result.isVisible())) {
        if (await flip.isVisible()) await flip.click();
        if (await known.isVisible()) await known.click();
      }
      issues.push(...(await auditPage(page, `${view.name} kết quả`)));
    }

    await guest.context().close();

    // Đang ở 360 px: từ rất dài không được làm tràn bố cục.
    const longTitle = 't'.repeat(200);
    await page.goto('/sets/new');
    await visibleField(page, 'Tên bộ từ').fill(longTitle);
    for (const index of [0, 1]) {
      await visibleField(page, 'Từ')
        .nth(index)
        .fill(`${'w'.repeat(199)}${index}`);
      await visibleField(page, 'Nghĩa').nth(index).fill('n'.repeat(1000));
    }
    await page.getByRole('button', { name: 'Lưu bộ từ' }).click();
    await expect(page.getByRole('heading', { name: longTitle })).toBeVisible();
    const longPath = new URL(page.url()).pathname;
    for (const path of [
      longPath,
      '/sets',
      `${longPath}/edit`,
      `${longPath}/study/flashcard`,
      `${longPath}/study/write`,
      `${longPath}/study/mcq`,
    ]) {
      await page.goto(path);
      issues.push(...(await auditPage(page, `từ dài ${path.replace(longPath, '/sets/:id')}`)));
    }

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${setPath}/study/flashcard`);
    await page.getByRole('button', { name: /^Xem nghĩa/ }).click();
    const animated = await page.evaluate(() =>
      [...document.querySelectorAll('*')]
        .filter((element) => {
          const style = getComputedStyle(element);
          return [style.transitionDuration, style.animationDuration].some((value) =>
            value.split(',').some((part) => parseFloat(part) > 0.01),
          );
        })
        .map((element) => element.tagName.toLowerCase()),
    );
    issues.push(...animated.map((tag) => `giảm chuyển động: ${tag} vẫn chạy hiệu ứng`));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await applyAuditView(page, AUDIT_VIEWS[0]);
    expect([...new Set(issues)]).toEqual([]);
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
