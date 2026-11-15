import { expect, test } from '@playwright/test';
import { openAndSettle, watchProblems } from '../support/page-guards';

const privateRoutes = ['/dashboard', '/dashboard/overview', '/dashboard/orders', '/admin'];

test.describe('workspace is closed to anonymous visitors', () => {
  for (const route of privateRoutes) {
    test(`${route} asks for sign-in instead of showing workspace content`, async ({ page }) => {
      await openAndSettle(page, route);

      await expect(page.getByRole('heading', { name: 'Selamat datang kembali' })).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Masuk' }).last()).toBeVisible();
    });
  }

  test('an anonymous visit stores no session and sends no credentials', async ({ page }) => {
    const authorized: string[] = [];
    page.on('request', (request) => {
      if (request.headers()['authorization']) authorized.push(request.url());
    });

    await openAndSettle(page, '/dashboard');

    const sessionKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => /^sb-|supabase\.auth/i.test(key)),
    );
    expect(sessionKeys).toEqual([]);
    expect(authorized).toEqual([]);
  });
});

test.describe('sign-in form', () => {
  test('uses the right input types and autocomplete hints', async ({ page }) => {
    await openAndSettle(page, '/login');

    await expect(page.locator('input[type="email"]')).toHaveAttribute('autocomplete', 'email');
    await expect(page.locator('input[type="password"]')).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
    await expect(page.getByRole('button', { name: 'Lupa kata sandi?' })).toBeVisible();
  });

  test('empty submission is stopped by validation, not sent', async ({ page }) => {
    const authCalls: string[] = [];
    page.on('request', (request) => {
      if (/\/auth\/v1\//.test(request.url())) authCalls.push(request.url());
    });

    await openAndSettle(page, '/login');
    await page.getByRole('button', { name: 'Masuk' }).last().click();

    await expect(page).toHaveURL(/\/login$/);
    const invalid = await page.locator('input:invalid').count();
    expect(invalid).toBeGreaterThanOrEqual(2);
    expect(authCalls).toEqual([]);
  });
});

test.describe('registration form', () => {
  test('requires every field and a password of at least six characters', async ({ page }) => {
    const problems = watchProblems(page);

    await openAndSettle(page, '/login?mode=register');

    await expect(page.getByRole('heading', { name: 'Buat akun' })).toBeVisible();
    const visibleInputs = page.locator('input:visible');
    await expect(visibleInputs).toHaveCount(4);
    for (const input of await visibleInputs.all()) {
      await expect(input).toHaveJSProperty('required', true);
    }
    await expect(page.locator('input[type="password"]')).toHaveJSProperty('minLength', 6);
    await expect(page.locator('input[type="password"]')).toHaveAttribute(
      'autocomplete',
      'new-password',
    );

    expect(problems.pageErrors).toEqual([]);
  });
});
