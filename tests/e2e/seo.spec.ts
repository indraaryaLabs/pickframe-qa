import { expect, test } from '@playwright/test';
import { openAndSettle } from '../support/page-guards';

const publicPaths = ['/', '/pricing', '/guide', '/terms', '/privacy'];
const privatePrefixes = ['/dashboard', '/g/', '/i/', '/operator', '/admin'];

test.describe('crawler guidance', () => {
  test('robots.txt keeps private areas out of search and points to the sitemap', async ({
    request,
  }) => {
    const response = await request.get('/robots.txt');
    const body = await response.text();

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');
    expect(body).toMatch(/^User-agent: \*$/m);
    for (const prefix of ['/dashboard', '/g/', '/i/', '/operator']) {
      expect(body, `Disallow for ${prefix}`).toContain(`Disallow: ${prefix}`);
    }
    expect(body).toMatch(/^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m);
  });

  test('sitemap.xml lists exactly the public pages', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    const body = await response.text();

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/xml/);
    expect(body).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');

    const paths = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => new URL(match[1] ?? '').pathname,
    );
    expect([...paths].sort()).toEqual([...publicPaths].sort());
    for (const path of paths) {
      for (const prefix of privatePrefixes) expect(path.startsWith(prefix)).toBe(false);
    }
  });

  test('every sitemap URL resolves', async ({ request }) => {
    for (const path of publicPaths) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
    }
  });
});

test.describe('page metadata', () => {
  for (const path of publicPaths) {
    test(`${path} has a description and a viewport declaration`, async ({ page }) => {
      await openAndSettle(page, path);

      const description = page.locator('meta[name="description"]');
      await expect(description).toHaveAttribute('content', /.{40,}/);
      await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
        'content',
        /width=device-width/,
      );
    });
  }
});
