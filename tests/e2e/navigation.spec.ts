import { expect, test } from '@playwright/test';
import { openAndSettle, watchProblems } from '../support/page-guards';

interface PublicPage {
  path: string;
  title: RegExp;
  heading: string | RegExp;
}

const publicPages: readonly PublicPage[] = [
  { path: '/', title: /· PickFrame$/, heading: /\S/ },
  { path: '/pricing', title: /^Harga · PickFrame$/, heading: 'Harga PickFrame' },
  { path: '/guide', title: /^Panduan · PickFrame$/, heading: /\S/ },
  { path: '/privacy', title: /^Privasi · PickFrame$/, heading: 'Kebijakan Privasi' },
  { path: '/terms', title: /^Ketentuan · PickFrame$/, heading: 'Ketentuan Layanan' },
];

test.describe('public pages', () => {
  for (const { path, title, heading } of publicPages) {
    test(`${path} loads cleanly`, async ({ page }) => {
      const problems = watchProblems(page);

      const response = await openAndSettle(page, path);

      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(title);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
      await expect(page.locator('html')).toHaveAttribute('lang', 'id');

      expect(problems.pageErrors, 'uncaught exceptions').toEqual([]);
      expect(problems.consoleErrors, 'console errors').toEqual([]);
      test.info().annotations.push(
        ...problems.thirdPartyFailures.map((entry) => ({
          type: 'third-party',
          description: entry,
        })),
      );
      expect(problems.failedRequests, 'failed requests').toEqual([]);
    });

    test(`${path} declares a canonical URL for itself`, async ({ page }) => {
      await openAndSettle(page, path);

      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href', /^https?:\/\//);
      const href = (await canonical.getAttribute('href')) ?? '';
      expect(new URL(href).pathname).toBe(path);
    });
  }
});

test.describe('landing page navigation', () => {
  test('in-page anchors in the header and footer all resolve to a section', async ({ page }) => {
    await openAndSettle(page, '/');

    const hashes = await page
      .locator('a[href^="#"]')
      .evaluateAll((links) =>
        [...new Set(links.map((link) => link.getAttribute('href') ?? ''))].filter(
          (href) => href.length > 1,
        ),
      );
    expect(hashes.length).toBeGreaterThan(3);

    for (const hash of hashes) {
      await expect(page.locator(hash), `target of ${hash}`).toHaveCount(1);
    }
  });

  test('a header link scrolls its section into view', async ({ page }) => {
    await openAndSettle(page, '/');

    await page.getByRole('navigation').first().getByRole('link', { name: /Alur/ }).click();

    await expect(page).toHaveURL(/#flow$/);
    await expect(page.locator('#flow')).toBeInViewport({ ratio: 0.05 });
  });

  test('the skip link jumps to the main content', async ({ page }) => {
    await openAndSettle(page, '/');

    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: /Lewati ke konten/ });
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/#main$/);
  });

  test('the primary call to action opens the registration form', async ({ page }) => {
    await openAndSettle(page, '/');

    await page
      .getByRole('link', { name: /Mulai gratis/ })
      .first()
      .click();

    await expect(page).toHaveURL(/\/login\?mode=register$/);
    await expect(page.getByRole('heading', { name: 'Buat akun' })).toBeVisible();
  });

  test('footer legal links reach the policy pages', async ({ page }) => {
    await openAndSettle(page, '/');

    await page.getByRole('contentinfo').getByRole('link', { name: 'Privasi' }).first().click();
    await expect(page).toHaveURL(/\/privacy$/);

    await page.goBack();
    await page.getByRole('contentinfo').getByRole('link', { name: 'Ketentuan' }).first().click();
    await expect(page).toHaveURL(/\/terms$/);
  });

  test('FAQ items expand and collapse', async ({ page }) => {
    await openAndSettle(page, '/#faq');

    const question = page.locator('#faq button[aria-expanded]').first();
    await question.scrollIntoViewIfNeeded();

    // The first item may be open by default, so flip whatever state it starts in.
    const initial = await question.getAttribute('aria-expanded');
    const flipped = String(initial !== 'true');

    await question.click();
    await expect(question).toHaveAttribute('aria-expanded', flipped);
    await question.click();
    await expect(question).toHaveAttribute('aria-expanded', initial ?? 'false');
  });
});

test.describe('internal links', () => {
  test('every internal link on the public pages lands on a real route', async ({ page }) => {
    const hrefs = new Set<string>();
    for (const { path } of publicPages) {
      await openAndSettle(page, path);
      const found = await page
        .locator('a[href^="/"]')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
      for (const href of found) hrefs.add(href);
    }
    expect(hrefs.size).toBeGreaterThan(4);

    for (const href of hrefs) {
      await openAndSettle(page, href);
      // A route the app does not know renders the gallery error state.
      await expect(
        page.getByRole('heading', { name: 'Galeri belum dapat dimuat' }),
        `${href} should be a known route`,
      ).toHaveCount(0);
    }
  });
});
