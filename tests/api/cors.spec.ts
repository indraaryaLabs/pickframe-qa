import { expect, test } from '@playwright/test';
import { allowedOrigin, selectOrigin } from '../support/env';

const hostile = 'https://evil.example';

test.describe('CORS policy', () => {
  test('preflight from the web app origin is approved with credentials', async ({ request }) => {
    const response = await request.fetch('/api/projects', {
      method: 'OPTIONS',
      headers: {
        Origin: allowedOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type',
      },
    });
    const headers = response.headers();

    expect(response.status()).toBe(204);
    expect(headers['access-control-allow-origin']).toBe(allowedOrigin);
    expect(headers['access-control-allow-credentials']).toBe('true');
    expect(headers['vary']).toMatch(/origin/i);
    expect(headers['access-control-allow-headers']).toMatch(/authorization/i);
    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
      expect(headers['access-control-allow-methods']).toContain(method);
    }
  });

  test('the Select companion app origin is approved', async ({ request }) => {
    const response = await request.get('/api/select/access', { headers: { Origin: selectOrigin } });

    expect(response.headers()['access-control-allow-origin']).toBe(selectOrigin);
  });

  for (const origin of [hostile, 'null', 'https://pickframe.satuarah.click.evil.example']) {
    test(`an unlisted origin (${origin}) is not granted access on a normal request`, async ({
      request,
    }) => {
      const response = await request.get('/', { headers: { Origin: origin } });

      expect(response.status()).toBe(200);
      expect(response.headers()['access-control-allow-origin']).toBeUndefined();
    });

    test(`an unlisted origin (${origin}) is not granted access on a preflight`, async ({
      request,
    }) => {
      const response = await request.fetch('/api/projects', {
        method: 'OPTIONS',
        headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' },
      });

      expect(response.headers()['access-control-allow-origin']).toBeUndefined();
    });
  }

  test('credentialed responses never use a wildcard origin', async ({ request }) => {
    const response = await request.get('/', { headers: { Origin: allowedOrigin } });

    expect(response.headers()['access-control-allow-origin']).not.toBe('*');
  });

  test('responses vary on Origin so shared caches cannot mix up policies', async ({ request }) => {
    const withOrigin = await request.get('/', { headers: { Origin: allowedOrigin } });
    const withoutOrigin = await request.get('/');

    expect(withOrigin.headers()['vary']).toMatch(/origin/i);
    expect(withoutOrigin.headers()['vary']).toMatch(/origin/i);
  });
});
