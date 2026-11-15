import { expect, test } from '@playwright/test';
import { randomToken } from '../support/page-guards';

/**
 * Client-facing endpoints are reached through unguessable links instead of a
 * login. These checks use tokens that cannot exist, so they never touch real
 * data. Looking up a missing gallery counts against a per-client failure limit,
 * so the suite makes one such lookup per run on purpose.
 */
test.describe('public link endpoints', () => {
  test('an unknown gallery link returns a clean 404', async ({ request }) => {
    const response = await request.get(`/api/p/${randomToken('qa-gallery')}`);

    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/json');
    expect(await response.json()).toEqual({
      error: 'Gallery not found, or the link is not valid',
    });
  });

  test('an unknown invoice link returns a clean 404', async ({ request }) => {
    const response = await request.get(`/api/i/${randomToken('qa-invoice')}`);

    expect(response.status()).toBe(404);
    expect(await response.json()).toHaveProperty('error');
  });
});

test.describe('selection submission validation', () => {
  const submitPath = () => `/api/p/${randomToken('qa-submit')}/submit`;

  test('malformed JSON is rejected before any lookup', async ({ request }) => {
    const response = await request.post(submitPath(), {
      headers: { 'Content-Type': 'application/json' },
      data: '{ this is not json',
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'The selection data is not valid' });
  });

  test('an empty selection is rejected so a client cannot wipe a gallery', async ({ request }) => {
    const response = await request.post(submitPath(), { data: { selected_photos: [] } });

    expect(response.status()).toBe(400);
    expect(await response.json()).toHaveProperty('error');
  });

  test('a photo without a file name is rejected', async ({ request }) => {
    const response = await request.post(submitPath(), {
      data: { selected_photos: [{ drive_id: 'abc' }] },
    });

    expect(response.status()).toBe(400);
  });

  test('a well-formed selection for an unknown link is a 404 and writes nothing', async ({
    request,
  }) => {
    const response = await request.post(submitPath(), {
      data: { selected_photos: [{ drive_id: 'qa-drive-id', file_name: 'IMG_0001.jpg' }] },
    });

    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ error: 'That project is not valid' });
  });

  test('a body over the 1 MiB limit is refused rather than processed', async ({ request }) => {
    // The same payload without padding is a 404 (valid shape, unknown link), so a
    // 400 here can only come from the body-size limit.
    const response = await request.post(submitPath(), {
      data: {
        selected_photos: [{ drive_id: 'qa-drive-id', file_name: 'IMG_0001.jpg' }],
        padding: 'x'.repeat(1_150_000),
      },
    });

    expect(response.status()).toBe(400);
  });
});
