import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openAndSettle } from '../support/page-guards';

/**
 * Motion is reduced so the whole page is in its final, fully visible state when it is scanned.
 * With reveal animations running, below-the-fold content is still transparent and axe cannot
 * judge it, which makes results depend on timing.
 */
test.use({ reducedMotion: 'reduce' });

const standards = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Rules with an open, documented defect on a given page. They are excluded from the gate for that
 * page only and are tracked by the expected-failure tests in known-defects.spec.ts, so a fix is
 * noticed and a new violation elsewhere still fails the run.
 */
const trackedRules: Readonly<Record<string, readonly string[]>> = {
  '/': ['color-contrast', 'label-content-name-mismatch'],
  '/pricing': ['color-contrast'],
  '/login': ['color-contrast'],
  '/login?mode=register': ['color-contrast'],
};

const pages = ['/', '/pricing', '/guide', '/privacy', '/terms', '/login', '/login?mode=register'];

export async function auditPage(page: Page, path: string) {
  await openAndSettle(page, path);
  await page.evaluate(() => document.fonts.ready);
  return new AxeBuilder({ page }).withTags(standards).analyze();
}

test.describe('accessibility (axe-core, WCAG 2.2 AA)', () => {
  for (const path of pages) {
    test(`${path} has no serious or critical violations beyond the tracked defects`, async ({
      page,
    }) => {
      const { violations } = await auditPage(page, path);
      const tracked = trackedRules[path] ?? [];

      test.info().annotations.push(
        ...violations.map((violation) => ({
          type: `axe:${violation.impact ?? 'unknown'}`,
          description: `${violation.id} (${violation.nodes.length} nodes): ${violation.help}`,
        })),
      );
      const blocking = violations.filter(
        (violation) =>
          (violation.impact === 'serious' || violation.impact === 'critical') &&
          !tracked.includes(violation.id),
      );
      expect(
        blocking.map((violation) => `${violation.id}: ${violation.nodes.length} nodes`),
      ).toEqual([]);
    });
  }

  test('keyboard focus lands on a control from the first Tab press', async ({ page }) => {
    await openAndSettle(page, '/');

    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());

    expect(focused).not.toBe('body');
  });
});
