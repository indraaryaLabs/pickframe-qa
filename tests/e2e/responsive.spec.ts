import { expect, test } from '@playwright/test';
import { openAndSettle } from '../support/page-guards';

const pages = ['/', '/pricing', '/guide', '/privacy', '/terms', '/login', '/login?mode=register'];

const viewports = [
  { name: 'small phone', width: 320, height: 568 },
  { name: 'Android phone', width: 360, height: 800 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'wide desktop', width: 1920, height: 1080 },
] as const;

/** Pages that scroll sideways on small screens. See docs/findings/QA-008. */
const knownOverflow = new Set([
  '/pricing@320',
  '/pricing@360',
  '/pricing@390',
  '/guide@320',
  '/guide@360',
]);

test.describe('layout holds at every width', () => {
  for (const { name, width, height } of viewports) {
    for (const path of pages) {
      test(`${path} has no horizontal scroll on a ${name} (${width}px)`, async ({ page }) => {
        test.fail(
          knownOverflow.has(`${path}@${width}`),
          'QA-008: public pages overflow small screens',
        );

        await page.setViewportSize({ width, height });
        await openAndSettle(page, path);

        const overflow = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }));
        expect(
          overflow.scroll,
          `scrollWidth ${overflow.scroll} > clientWidth ${overflow.client}`,
        ).toBeLessThanOrEqual(overflow.client);
      });
    }
  }
});

test.describe('touch devices', () => {
  test('landing page is usable on a phone @mobile', async ({ page }) => {
    await openAndSettle(page, '/');

    const cta = page.getByRole('link', { name: /Mulai gratis/ }).first();
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    expect(box?.height ?? 0, 'primary call to action height').toBeGreaterThanOrEqual(24);
    expect(box?.width ?? 0, 'primary call to action width').toBeGreaterThanOrEqual(24);

    await cta.tap();
    await expect(page).toHaveURL(/\/login\?mode=register$/);
  });

  test('the registration form fits a phone and its fields are tappable @mobile', async ({
    page,
  }) => {
    await openAndSettle(page, '/login?mode=register');

    for (const input of await page.locator('input:visible').all()) {
      const box = await input.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
    }
  });

  test('pricing page does not scroll sideways on a phone @mobile', async ({ page }) => {
    await openAndSettle(page, '/pricing');

    const sideways = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(sideways).toBe(false);
  });
});
