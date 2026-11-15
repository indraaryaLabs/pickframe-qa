import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { openAndSettle, randomToken, stableTitle } from '../support/page-guards';

/**
 * Reproduced defects, written as the behaviour the product SHOULD have.
 *
 * Each test is marked as an expected failure, so the suite stays green while the defect is open
 * and the report still lists it. When a defect is fixed its test starts passing, Playwright
 * reports "expected to fail but passed", and the run goes red until the marker is removed. That
 * way a fix cannot be forgotten and a regression cannot hide.
 *
 * Details, evidence and suggested fixes: docs/findings/.
 */

const unknownRoute = () => `/qa-unknown-${randomToken('route')}`;

test.describe('known defects', () => {
  test('QA-001: an unknown URL shows a not-found page, not the gallery error', async ({ page }) => {
    test.fail(true, 'QA-001: unknown routes render the "gallery could not load" state');

    await openAndSettle(page, unknownRoute());

    await expect(page.getByRole('heading', { name: 'Galeri belum dapat dimuat' })).toHaveCount(0);
  });

  test('QA-002: the document title does not repeat the brand name', async ({ page }) => {
    test.fail(true, 'QA-002: unknown routes are titled "PickFrame · PickFrame"');

    await openAndSettle(page, unknownRoute());
    const title = await stableTitle(page);

    expect(title).not.toMatch(/^(.+) · \1$/);
  });

  test('QA-003: an unknown URL does not claim the home page as its canonical', async ({ page }) => {
    test.fail(true, 'QA-003: every unknown URL declares canonical = home page');

    const path = unknownRoute();
    await openAndSettle(page, path);
    await stableTitle(page);

    const { canonical, robots } = await page.evaluate(() => ({
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
    }));
    const canonicalPath = new URL(canonical ?? page.url()).pathname;
    const noindex = /noindex/.test(robots);

    expect({ canonicalPath, noindex }).not.toMatchObject({ canonicalPath: '/', noindex: false });
  });

  test('QA-004: the gallery error is written in the visitor’s language, without status codes', async ({
    page,
  }) => {
    test.fail(
      true,
      'QA-004: error copy is English and exposes "(status 404)" in the Indonesian UI',
    );

    await openAndSettle(page, `/g/${randomToken('qa-defect-gallery')}`);

    await expect(page.getByText(/\(status \d{3}\)/)).toHaveCount(0);
    await expect(page.getByText(/^Gallery not found/)).toHaveCount(0);
  });

  test('QA-005: a missing static asset is a 404, not the app shell', async ({ request }) => {
    test.fail(true, 'QA-005: /assets/* misses are rewritten to index.html with HTTP 200');

    const response = await request.get(`/assets/${randomToken('qa-missing')}.js`);

    expect(response.status()).toBe(404);
  });

  test.describe('accessibility', () => {
    test.use({ reducedMotion: 'reduce' });

    const audit = async (page: import('@playwright/test').Page, path: string, rule: string) => {
      await openAndSettle(page, path);
      await page.evaluate(() => document.fonts.ready);
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .withRules([rule])
        .analyze();
      return violations.flatMap((violation) =>
        violation.nodes.map((node) => node.target.join(' ')),
      );
    };

    for (const path of ['/', '/pricing', '/login', '/login?mode=register']) {
      test(`QA-006: text on ${path} meets the WCAG AA contrast ratio`, async ({ page }) => {
        test.fail(true, 'QA-006: low-contrast grey text on light backgrounds');

        expect(await audit(page, path, 'color-contrast')).toEqual([]);
      });
    }

    test('QA-007: landing buttons announce the text they display', async ({ page }) => {
      test.fail(true, 'QA-007: aria-label does not contain the visible label (WCAG 2.5.3)');

      expect(await audit(page, '/', 'label-content-name-mismatch')).toEqual([]);
    });
  });
});
