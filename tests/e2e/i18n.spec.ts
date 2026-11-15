import { expect, test } from '@playwright/test';
import { openAndSettle } from '../support/page-guards';

test.describe('language switch', () => {
  test('switches the whole page to English and back', async ({ page }) => {
    await openAndSettle(page, '/pricing');
    const heading = page.getByRole('heading', { level: 1 });
    const indonesian = await heading.innerText();
    const en = page.getByRole('button', { name: 'EN', exact: true }).first();
    const id = page.getByRole('button', { name: 'ID', exact: true }).first();

    await en.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(en).toHaveAttribute('aria-pressed', 'true');
    await expect(id).toHaveAttribute('aria-pressed', 'false');
    await expect(heading).not.toHaveText(indonesian);

    await id.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(heading).toHaveText(indonesian);
  });

  test('the choice survives a reload and carries to other pages', async ({ page }) => {
    await openAndSettle(page, '/');
    await page.getByRole('button', { name: 'EN', exact: true }).first().click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await openAndSettle(page, '/privacy');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Kebijakan Privasi');
  });
});
