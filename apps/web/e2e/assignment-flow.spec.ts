import { spawnSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';
import { AUDIT_VIEWS, applyAuditView, auditPage } from './audit';

const stamp = Date.now();
const password = 'mat-khau-e2e-123';
const teacherEmail = `e2e-flow-gv-${stamp}@example.com`;
const studentEmail = `e2e-flow-hs-${stamp}@example.com`;
const setId = `e2e-flow-set-${stamp}`;
const setTitle = `Bộ riêng tư ${stamp}`;
const className = `Fa1 ${stamp}`;
const studentName = `Lan ${stamp}`;
const cards = [
  { term: 'cat', definition: 'con mèo' },
  { term: 'dog', definition: 'con chó' },
  { term: 'fish', definition: 'con cá' },
];

const visibleField = (page: Page, label: string) =>
  page.getByLabel(label, { exact: true }).filter({ visible: true });

function sql(input: string) {
  const result = spawnSync('node', ['e2e/run-sql.mjs'], { input, encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
}

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
}

/** Đọc thanh tiến độ của phiên học; Flashcard có thêm bộ đếm riêng nên không tìm theo chữ. */
async function progress(page: Page, done: number) {
  await expect(page.getByRole('progressbar', { name: 'Tiến độ phiên học' })).toHaveAttribute(
    'aria-valuenow',
    String(done),
  );
}

async function doFlashcards(page: Page) {
  for (let done = 0; done < cards.length; done += 1) {
    await progress(page, done);
    await page.getByRole('button', { name: 'Xem nghĩa' }).click();
    await page.getByRole('button', { name: /Đã nhớ/ }).click();
  }
}

async function doChoices(page: Page) {
  for (let done = 0; done < cards.length; done += 1) {
    await progress(page, done);
    const term = await page
      .getByRole('heading', { level: 1 })
      .filter({ visible: true })
      .innerText();
    const card = cards.find((item) => item.term === term);
    await page.getByRole('button', { name: new RegExp(card?.definition ?? '') }).click();
    await page.getByRole('button', { name: 'Câu tiếp theo' }).click();
  }
}

async function doWriting(page: Page) {
  for (let done = 0; done < cards.length; done += 1) {
    await progress(page, done);
    const shown = await page.locator('p.text-h1').filter({ visible: true }).innerText();
    const card = cards.find((item) => item.definition === shown.trim());
    await page.getByLabel('Nhập từ').fill(card?.term ?? '');
    await page.getByRole('button', { name: 'Kiểm tra' }).click();
    await page.getByRole('button', { name: 'Câu tiếp theo' }).click();
  }
}

test('giáo viên giao bài 3 chế độ từ bộ riêng tư, học sinh làm và nộp, giáo viên theo dõi', async ({
  browser,
  baseURL,
}) => {
  // Hai người dùng, ba phiên học và audit nhiều trang: máy CI cần vài phút.
  test.setTimeout(480_000);
  const teacher = await (await browser.newContext({ baseURL })).newPage();
  await signUp(teacher, 'Cô Hoa', teacherEmail);
  sql(`
    UPDATE "User" SET role = 'TEACHER' WHERE email = '${teacherEmail}';
    INSERT INTO "StudySet" (id, "ownerId", title, visibility, "cardCount", "updatedAt")
      SELECT '${setId}', id, '${setTitle}', 'PRIVATE', ${cards.length}, now()
      FROM "User" WHERE email = '${teacherEmail}';
    INSERT INTO "Card" (id, "setId", position, term, definition, "updatedAt") VALUES
      ${cards.map((card, index) => `('e2e-flow-card-${stamp}-${index}', '${setId}', ${index}, '${card.term}', '${card.definition}', now())`).join(',\n      ')};
  `);

  // Chưa có lớp: Tổng quan giáo viên hướng dẫn 3 bước, nút chính là Tạo lớp.
  await teacher.goto('/dashboard');
  await expect(teacher.getByText('Bắt đầu dạy trong 3 bước')).toBeVisible();
  await teacher.getByRole('button', { name: 'Tạo lớp', exact: true }).click();
  const createDialog = teacher.getByRole('dialog', { name: 'Tạo lớp' });
  await createDialog.getByLabel('Tên lớp').fill(className);
  await createDialog.getByRole('button', { name: 'Tạo lớp' }).click();
  await teacher.waitForURL('**/classes/*');
  const classPath = new URL(teacher.url()).pathname;
  const copyLabel = await teacher
    .getByRole('button', { name: /^Sao chép mã lớp / })
    .getAttribute('aria-label');
  const joinCode = (copyLabel ?? '').replace('Sao chép mã lớp ', '').trim();
  expect(joinCode).toMatch(/^[A-Z2-9]{6}$/);

  // Học sinh vào lớp.
  const student = await (await browser.newContext({ baseURL })).newPage();
  await signUp(student, studentName, studentEmail);
  await student.goto('/classes');
  await student.getByRole('button', { name: 'Tham gia lớp' }).click();
  const joinDialog = student.getByRole('dialog', { name: 'Tham gia lớp' });
  await joinDialog.getByLabel('Mã lớp').fill(joinCode);
  await joinDialog.getByRole('button', { name: 'Tham gia' }).click();
  await expect(
    student.getByRole('list', { name: 'Lớp đã tham gia' }).getByText(className),
  ).toBeVisible();

  // Giáo viên giao bài từ Tổng quan: chọn lớp, bộ riêng tư, 3 chế độ.
  await teacher.goto('/dashboard');
  await teacher.getByRole('button', { name: 'Giao bài' }).click();
  const assign = teacher.getByRole('dialog', { name: 'Giao bài' });
  await assign.getByRole('combobox', { name: 'Lớp' }).fill(className);
  await assign.getByRole('option', { name: new RegExp(className) }).click();
  await assign.getByRole('combobox', { name: 'Bộ từ' }).fill(setTitle);
  await assign.getByRole('option', { name: new RegExp(setTitle) }).click();
  await assign.getByRole('checkbox', { name: 'Cho học sinh trong lớp xem bộ này' }).check();
  await assign.getByRole('checkbox', { name: /Ghép cặp/ }).uncheck();
  await assign.getByRole('button', { name: 'Giao bài' }).click();
  await expect(assign).toBeHidden();

  // Học sinh thấy bài ở Tổng quan, làm lần lượt 3 chế độ rồi nộp.
  await student.goto('/dashboard');
  const work = student.getByRole('region', { name: 'Bài tập lớp' });
  await expect(work).toContainText(setTitle);
  await work.getByRole('link', { name: new RegExp(`Làm bài ${setTitle}`) }).click();
  await student.waitForURL('**/classes/assignments/*');
  const assignmentUrl = student.url();
  await student.getByRole('link', { name: /Bắt đầu: Flashcard/ }).click();
  await doFlashcards(student);
  await student.getByRole('link', { name: 'Chế độ tiếp: Trắc nghiệm' }).click();
  await doChoices(student);
  await student.getByRole('link', { name: 'Chế độ tiếp: Luyện viết' }).click();
  await doWriting(student);
  await student.getByRole('link', { name: 'Về bài tập để nộp' }).click();
  await student.waitForURL('**/classes/assignments/*');
  await student.getByRole('button', { name: 'Nộp bài' }).click();
  await student.getByRole('dialog').getByRole('button', { name: 'Nộp bài' }).click();
  await expect(student.getByText(/Đã nộp lúc/)).toBeVisible();

  // Giáo viên thấy bài vừa nộp ở Tổng quan và trong hồ sơ học sinh.
  await teacher.goto('/dashboard');
  await expect(teacher.getByRole('region', { name: 'Bài vừa nộp' })).toContainText(studentName);
  await teacher.goto(`${classPath}?tab=students`);
  await teacher.getByRole('button', { name: new RegExp(`${studentName}, mở hồ sơ`) }).click();
  const profile = teacher.getByRole('dialog', { name: studentName });
  await expect(profile.getByText('1/1')).toBeVisible();
  await expect(profile).toContainText(setTitle);
  await profile.getByRole('button', { name: 'Đóng' }).click();

  // Các trang mới đạt accessibility ở light, dark và 360 px.
  const issues: string[] = [];
  for (const view of AUDIT_VIEWS) {
    await applyAuditView(teacher, view);
    for (const path of ['/dashboard', classPath, `${classPath}?tab=students`]) {
      await teacher.goto(path);
      issues.push(...(await auditPage(teacher, `${view.name} giáo viên ${path}`)));
    }
    await applyAuditView(student, view);
    for (const path of ['/dashboard', new URL(assignmentUrl).pathname]) {
      await student.goto(path);
      issues.push(...(await auditPage(student, `${view.name} học sinh ${path}`)));
    }
  }
  expect([...new Set(issues)]).toEqual([]);
});
