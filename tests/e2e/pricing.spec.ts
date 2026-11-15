import { expect, test } from '@playwright/test';
import { openAndSettle } from '../support/page-guards';

const moneyPattern = /Rp\s?\d{1,3}(?:\.\d{3})*/g;

const pricesOn = async (text: string): Promise<string[]> => [
  ...new Set((text.match(moneyPattern) ?? []).map((value) => value.replace(/\s/g, ''))),
];

const rupiah = (value: string): number => Number(value.replace(/\D/g, ''));

test.describe('pricing', () => {
  test('lists the three plans', async ({ page }) => {
    await openAndSettle(page, '/pricing');

    for (const plan of ['Free', 'Pro', 'Studio']) {
      await expect(page.getByRole('heading', { name: plan, exact: true }).first()).toBeVisible();
    }
  });

  test('prices are well-formed rupiah amounts', async ({ page }) => {
    await openAndSettle(page, '/pricing');

    const prices = await pricesOn(await page.locator('body').innerText());
    expect(prices.length).toBeGreaterThanOrEqual(2);
    for (const price of prices) expect(price).toMatch(/^Rp\d{1,3}(\.\d{3})*$/);
  });

  test('the landing page never quotes a price the pricing page does not', async ({ page }) => {
    await openAndSettle(page, '/pricing');
    const onPricingPage = await pricesOn(await page.locator('body').innerText());

    await openAndSettle(page, '/');
    const onLanding = await pricesOn(await page.locator('#pricing').innerText());

    expect(onLanding.length).toBeGreaterThan(0);
    for (const price of onLanding) expect(onPricingPage, `${price} on landing`).toContain(price);
  });

  test('plans are priced in ascending order: Pro below Studio', async ({ page }) => {
    await openAndSettle(page, '/');
    const section = page.locator('#pricing');
    const proCard = section
      .getByRole('heading', { name: 'Pro', exact: true })
      .locator('xpath=ancestor::*[contains(., "Rp")][1]');
    const studioCard = section
      .getByRole('heading', { name: 'Studio', exact: true })
      .locator('xpath=ancestor::*[contains(., "Rp")][1]');

    const [pro] = await pricesOn(await proCard.innerText());
    const [studio] = await pricesOn(await studioCard.innerText());

    expect(pro).toBeDefined();
    expect(studio).toBeDefined();
    expect(rupiah(pro ?? '')).toBeLessThan(rupiah(studio ?? ''));
  });

  test('subscription terms are one click away', async ({ page }) => {
    await openAndSettle(page, '/pricing');

    await page
      .getByRole('link', { name: /ketentuan layanan/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/terms$/);
  });
});
