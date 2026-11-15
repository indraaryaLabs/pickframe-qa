import { expect, test } from '@playwright/test';

test.describe('service health', () => {
  test('GET / reports a machine-readable healthy status', async ({ request }) => {
    const response = await request.get('/');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    expect(await response.json()).toEqual({ status: 'ok', service: 'pickframe-api' });
  });

  test('health endpoint answers within a generous latency budget', async ({ request }) => {
    // Budget is deliberately loose: this guards against a hung function or a
    // paused database, not against ordinary cold-start variance.
    const started = Date.now();
    const response = await request.get('/');
    const elapsed = Date.now() - started;

    expect(response.ok()).toBe(true);
    expect(elapsed, `health took ${elapsed} ms`).toBeLessThan(8_000);
  });

  test('unknown API routes return 404', async ({ request }) => {
    const response = await request.get('/api/this-route-does-not-exist');
    expect(response.status()).toBe(404);
  });

  test('client-IP diagnostics endpoint is disabled in the deployed environment', async ({
    request,
  }) => {
    const response = await request.get('/api/debug/client-ip');
    expect(response.status()).toBe(404);
  });
});
