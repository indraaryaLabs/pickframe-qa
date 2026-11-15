import { expect, test } from '@playwright/test';
import { hs256Token, plausibleClaims, unsignedToken } from '../support/jwt';

const SOME_ID = '00000000-0000-4000-8000-000000000000';

/**
 * Every authenticated route in the API. Unauthenticated calls must be rejected
 * by the middleware before any handler runs, so none of these requests can read
 * or change data.
 */
const protectedRoutes: ReadonlyArray<readonly [method: string, path: string]> = [
  ['GET', '/api/subscription'],
  ['POST', '/api/subscription/trial'],
  ['POST', '/api/subscription/redeem'],
  ['POST', '/api/select/session'],
  ['GET', '/api/profile'],
  ['PUT', '/api/profile'],
  ['GET', '/api/projects'],
  ['POST', '/api/projects'],
  ['PUT', `/api/projects/${SOME_ID}`],
  ['DELETE', `/api/projects/${SOME_ID}`],
  ['GET', `/api/projects/${SOME_ID}/selections`],
  ['POST', `/api/projects/${SOME_ID}/rotate-link`],
  ['GET', '/api/packages'],
  ['POST', '/api/packages'],
  ['GET', '/api/studio-settings'],
  ['PUT', '/api/studio-settings'],
  ['GET', '/api/clients'],
  ['POST', '/api/clients'],
  ['GET', '/api/orders'],
  ['POST', '/api/orders'],
  ['GET', `/api/orders/${SOME_ID}`],
  ['DELETE', `/api/orders/${SOME_ID}`],
  ['GET', '/api/documents'],
  ['POST', '/api/documents'],
  ['DELETE', `/api/payments/${SOME_ID}`],
  ['GET', '/api/business/summary'],
  ['GET', '/api/business/revision'],
  ['GET', '/api/business/export'],
  ['GET', '/api/admin/ping'],
  ['GET', '/api/admin/accounts'],
  ['POST', '/api/admin/subscriptions'],
  ['POST', '/api/admin/codes'],
];

test.describe('authentication guard', () => {
  for (const [method, path] of protectedRoutes) {
    test(`${method} ${path} rejects anonymous callers`, async ({ request }) => {
      const response = await request.fetch(path, {
        method,
        data: method === 'GET' || method === 'DELETE' ? undefined : {},
      });

      expect(response.status()).toBe(401);
      expect(await response.json()).toMatchObject({ error: 'unauthorized' });
    });
  }

  test('Select session endpoint tells the companion app a session is required', async ({
    request,
  }) => {
    const response = await request.get('/api/select/access');

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({
      error: 'unauthorized',
      code: 'select_session_required',
    });
  });
});

test.describe('credential handling', () => {
  const target = '/api/projects';

  const rejected: ReadonlyArray<readonly [name: string, authorization: string]> = [
    ['a non-Bearer scheme', 'Basic dXNlcjpwYXNz'],
    ['an empty Bearer value', 'Bearer '],
    ['a Bearer value that is not a JWT', 'Bearer not-a-jwt'],
    ['an unsigned token (alg: none)', `Bearer ${unsignedToken()}`],
    [
      'an HS256 token signed with an attacker-chosen secret',
      `Bearer ${hs256Token('attacker-controlled-secret')}`,
    ],
    [
      'a token whose claims look legitimate but whose signature is invalid',
      `Bearer ${hs256Token('another-secret', { ...plausibleClaims(), role: 'service_role' })}`,
    ],
  ];

  for (const [name, authorization] of rejected) {
    test(`rejects ${name}`, async ({ request }) => {
      const response = await request.get(target, { headers: { Authorization: authorization } });

      expect(response.status()).toBe(401);
      expect(await response.json()).toMatchObject({ error: 'unauthorized' });
    });
  }

  test('401 responses do not reveal why the credential failed', async ({ request }) => {
    const response = await request.get(target, {
      headers: { Authorization: `Bearer ${hs256Token('x')}` },
    });
    const body = JSON.stringify(await response.json());

    expect(body).not.toMatch(/signature|algorithm|issuer|audience|jwks|expired/i);
  });
});
