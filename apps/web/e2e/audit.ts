import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const MIN_TARGET_PX = 44;

export const AUDIT_VIEWS = [
  { name: 'light 1280', width: 1280, height: 800, colorScheme: 'light' },
  { name: 'dark 360', width: 360, height: 740, colorScheme: 'dark' },
] as const;

export type AuditView = (typeof AUDIT_VIEWS)[number];

export async function applyAuditView(page: Page, view: AuditView) {
  await page.setViewportSize({ width: view.width, height: view.height });
  await page.emulateMedia({ colorScheme: view.colorScheme });
}

/** Trả về danh sách lỗi của màn hình đang mở, rỗng là đạt. */
export async function auditPage(page: Page, label: string): Promise<string[]> {
  await page.waitForLoadState('networkidle');
  // Đo giữa lúc chữ đang hiện dần thì axe báo thiếu tương phản. Bỏ qua hiệu ứng lặp vô hạn.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const issues = violations.flatMap(({ id, nodes }) =>
    nodes.slice(0, 4).map(({ target }) => `${label}: axe ${id} ${target.join(' ')}`),
  );

  const layout = await page.evaluate((minTarget) => {
    const isVisible = (element: Element) => {
      const { width, height } = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return width > 0 && height > 0 && style.visibility !== 'hidden';
    };
    const name = (element: Element) =>
      `${element.tagName.toLowerCase()} "${(element.getAttribute('aria-label') ?? element.textContent ?? '').trim().slice(0, 30)}"`;
    const controls = document.querySelectorAll(
      'a[href], button, input:not([type=hidden]), select, textarea, [role=button]',
    );
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      small: [...controls]
        .filter((element) => isVisible(element) && !element.closest('.sr-only'))
        .filter((element) => {
          const { width, height } = element.getBoundingClientRect();
          return width < minTarget - 0.5 || height < minTarget - 0.5;
        })
        .map((element) => {
          const { width, height } = element.getBoundingClientRect();
          return `${name(element)} ${Math.round(width)}x${Math.round(height)}`;
        }),
    };
  }, MIN_TARGET_PX);

  if (layout.overflow > 0) {
    issues.push(`${label}: tràn ngang ${layout.overflow}px`);
  }
  issues.push(...layout.small.map((item) => `${label}: vùng bấm nhỏ ${item}`));
  return issues;
}

/** Đi qua các phần tử bằng phím Tab, phần tử nào cũng phải có dấu hiệu focus. */
export async function auditFocus(page: Page, label: string, steps = 6): Promise<string[]> {
  const issues: string[] = [];
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (let step = 0; step < steps; step += 1) {
    await page.keyboard.press('Tab');
    const missing = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element || element === document.body) {
        return null;
      }
      const style = getComputedStyle(element);
      const hasRing =
        (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) ||
        style.boxShadow !== 'none';
      return hasRing
        ? null
        : `${element.tagName.toLowerCase()} ${element.textContent?.slice(0, 30)}`;
    });
    if (missing) {
      issues.push(`${label}: thiếu focus ở ${missing}`);
    }
  }
  return issues;
}
