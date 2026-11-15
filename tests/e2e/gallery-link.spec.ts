import { expect, test } from '@playwright/test';
import { openAndSettle, randomToken, watchProblems } from '../support/page-guards';

test.describe('client gallery link', () => {
  test('an unknown gallery link shows a friendly error and no photos', async ({ page }) => {
    const problems = watchProblems(page);

    await openAndSettle(page, `/g/${randomToken('qa-ui-gallery')}`);

    await expect(page).toHaveTitle('Galeri foto · PickFrame');
    await expect(page.getByRole('heading', { name: 'Galeri belum dapat dimuat' })).toBeVisible();
    await expect(page.getByText('Periksa tautan, atau minta fotografer Anda')).toBeVisible();
    await expect(page.locator('img')).toHaveCount(0);
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    expect(problems.pageErrors, 'uncaught exceptions').toEqual([]);
  });

  test('the legacy ?token= link form behaves the same way', async ({ page }) => {
    await openAndSettle(page, `/?token=${randomToken('qa-ui-legacy')}`);

    await expect(page).toHaveTitle('Galeri foto · PickFrame');
    await expect(page.getByRole('heading', { name: 'Galeri belum dapat dimuat' })).toBeVisible();
  });
});

test.describe('client invoice link', () => {
  test('an unknown invoice link explains itself in Indonesian', async ({ page }) => {
    const problems = watchProblems(page);

    await page.goto(`/i/${randomToken('qa-ui-invoice')}`);

    await expect(page).toHaveTitle('Dokumen · PickFrame');
    await expect(
      page.getByText('Invoice tidak ditemukan, atau tautannya tidak valid'),
    ).toBeVisible();
    await expect(page.getByText('Periksa tautan, atau minta fotografer')).toBeVisible();
    expect(problems.pageErrors, 'uncaught exceptions').toEqual([]);
  });
});
