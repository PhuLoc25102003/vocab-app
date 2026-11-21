import { spawnSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';
import { AUDIT_VIEWS, applyAuditView, auditPage } from './audit';

const stamp = Date.now();
const password = 'mat-khau-e2e-123';
const teacherEmail = `e2e-gv-${stamp}@example.com`;
const studentEmail = `e2e-hs-${stamp}@example.com`;
const setId = `e2e-class-set-${stamp}`;
const setTitle = `Bộ của lớp ${stamp}`;
const className = `10A1 ${stamp}`;
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

/** Trả lời đúng mọi câu trắc nghiệm của bộ ba thẻ. */
async function answerAll(page: Page) {
  for (let done = 0; done < cards.length; done += 1) {
    await expect(page.getByText(`${done}/${cards.length}`, { exact: true })).toBeVisible();
    const term = await page
      .getByRole('heading', { level: 1 })
      .filter({ visible: true })
      .innerText();
    const card = cards.find((item) => item.term === term);
    await page.getByRole('button', { name: new RegExp(card?.definition ?? '') }).click();
    await page.getByRole('button', { name: 'Câu tiếp theo' }).click();
  }
}

test('giáo viên tạo lớp và giao bài, học sinh vào lớp bằng mã, làm bài, giáo viên xem kết quả', async ({
  browser,
  baseURL,
}) => {
  // Hai người dùng, bốn trang và một phiên học, máy CI cần hơn 30 giây.
  test.setTimeout(180_000);
  const teacher = await (await browser.newContext({ baseURL })).newPage();
  await signUp(teacher, 'Cô Lan', teacherEmail);
  sql(`
    UPDATE "User" SET role = 'TEACHER' WHERE email = '${teacherEmail}';
    INSERT INTO "StudySet" (id, "ownerId", title, visibility, "cardCount", "updatedAt")
      SELECT '${setId}', id, '${setTitle}', 'PUBLIC', ${cards.length}, now()
      FROM "User" WHERE email = '${teacherEmail}';
    INSERT INTO "Card" (id, "setId", position, term, definition, "updatedAt") VALUES
      ${cards.map((card, index) => `('e2e-class-card-${stamp}-${index}', '${setId}', ${index}, '${card.term}', '${card.definition}', now())`).join(',\n      ')};
  `);

  // Giáo viên tạo lớp.
  await teacher.goto('/classes');
  await teacher.getByRole('button', { name: 'Tạo lớp' }).click();
  const createDialog = teacher.getByRole('dialog', { name: 'Tạo lớp' });
  await createDialog.getByLabel('Tên lớp').fill(className);
  await createDialog.getByRole('button', { name: 'Tạo lớp' }).click();
  await teacher.waitForURL('**/classes/*');
  await expect(teacher.getByRole('heading', { name: className })).toBeVisible();
  const joinCode = (
    await teacher.getByRole('region', { name: 'Mã lớp' }).locator('p').first().innerText()
  ).trim();
  expect(joinCode).toMatch(/^[A-Z2-9]{6}$/);
  const classPath = new URL(teacher.url()).pathname;

  // Giáo viên giao bài trắc nghiệm.
  await teacher.getByRole('button', { name: 'Giao bài' }).click();
  const form = teacher.getByRole('dialog', { name: 'Giao bài' });
  // Gõ ngay trong ô chọn bộ để lọc rồi chọn.
  await form.getByRole('combobox', { name: 'Bộ từ' }).fill(setTitle);
  await form.getByRole('option', { name: new RegExp(setTitle) }).click();
  // Chỉ giữ Trắc nghiệm trong lộ trình mặc định.
  for (const mode of [/Flashcard/, /Ghép cặp/, /Luyện viết/]) {
    await form.getByRole('checkbox', { name: mode }).uncheck();
  }
  await form.getByRole('button', { name: 'Giao bài' }).click();
  const assigned = teacher.getByRole('list', { name: 'Bài đã giao' });
  await expect(assigned.getByRole('link', { name: new RegExp(setTitle) })).toBeVisible();

  // Học sinh vào lớp bằng mã chữ thường và làm bài.
  const student = await (await browser.newContext({ baseURL })).newPage();
  await signUp(student, 'An', studentEmail);
  await student.goto('/classes');
  await student.getByRole('button', { name: 'Tham gia lớp' }).click();
  const joinDialog = student.getByRole('dialog', { name: 'Tham gia lớp' });
  await joinDialog.getByLabel('Mã lớp').fill(joinCode.toLowerCase());
  await joinDialog.getByRole('button', { name: 'Tham gia' }).click();
  await expect(
    student.getByRole('list', { name: 'Lớp đã tham gia' }).getByText(className),
  ).toBeVisible();
  const todo = student.getByRole('list', { name: 'Bài cần làm' }).getByRole('link');
  await expect(todo).toContainText('Chưa làm');
  await todo.click();
  await student.waitForURL('**/classes/assignments/*');
  await student.getByRole('link', { name: /Bắt đầu: Trắc nghiệm/ }).click();
  await student.waitForURL(
    (url) =>
      url.pathname.endsWith(`/sets/${setId}/study/mcq`) && url.searchParams.has('assignment'),
  );
  await answerAll(student);
  await expect(student.getByText(/^Bạn nhớ/)).toBeVisible();
  await student.getByRole('link', { name: 'Về bài tập để nộp' }).click();
  await student.waitForURL('**/classes/assignments/*');
  await student.getByRole('button', { name: 'Nộp bài' }).click();
  await student.getByRole('dialog').getByRole('button', { name: 'Nộp bài' }).click();
  await expect(student.getByText(/Đã nộp lúc/)).toBeVisible();
  await student.goto('/classes');
  await expect(student.getByRole('list', { name: 'Bài cần làm' }).getByRole('link')).toContainText(
    'Đã nộp',
  );

  // Giáo viên xem kết quả bài và kết quả của học sinh.
  await teacher.goto(classPath);
  await assigned.getByRole('link', { name: new RegExp(setTitle) }).click();
  await teacher.waitForURL('**/assignments/*');
  await expect(teacher.getByText('1/1', { exact: true })).toBeVisible();
  const results = teacher.getByRole('list', { name: 'Kết quả từng học sinh' });
  await expect(results).toContainText('Đã làm');
  await expect(results).toContainText('3/3 (100%)');
  await results.getByRole('link', { name: 'An' }).click();
  await teacher.waitForURL('**/members/*');
  await expect(teacher.getByText('Đã làm 1/1 bài.')).toBeVisible();

  // Các trang lớp học đạt accessibility ở light và dark 360 px.
  const issues: string[] = [];
  const teacherPaths = ['/classes', classPath, new URL(teacher.url()).pathname];
  for (const view of AUDIT_VIEWS) {
    await applyAuditView(teacher, view);
    for (const path of teacherPaths) {
      await teacher.goto(path);
      issues.push(...(await auditPage(teacher, `${view.name} ${path}`)));
    }
    await applyAuditView(student, view);
    await student.goto('/classes');
    issues.push(...(await auditPage(student, `${view.name} học sinh /classes`)));
  }
  expect([...new Set(issues)]).toEqual([]);
});
