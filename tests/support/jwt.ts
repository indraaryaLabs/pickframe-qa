import { createHmac } from 'node:crypto';

const b64url = (input: Buffer | string): string => Buffer.from(input).toString('base64url');

const nowSeconds = (): number => Math.floor(Date.now() / 1000);

/** A claim set that looks exactly like a real Supabase user token, minus a valid signature. */
export function plausibleClaims(): Record<string, unknown> {
  return {
    sub: '00000000-0000-4000-8000-000000000001',
    aud: 'authenticated',
    role: 'authenticated',
    iat: nowSeconds(),
    exp: nowSeconds() + 3600,
  };
}

/** Token with `alg: none` and an empty signature. */
export function unsignedToken(claims: Record<string, unknown> = plausibleClaims()): string {
  return `${b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${b64url(JSON.stringify(claims))}.`;
}

/**
 * Token signed with a symmetric key the server has never seen. A verifier that
 * accepts HS256 where only asymmetric algorithms are expected is open to
 * algorithm-confusion forgery.
 */
export function hs256Token(
  secret: string,
  claims: Record<string, unknown> = plausibleClaims(),
): string {
  const head = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(claims));
  const signature = createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${signature}`;
}
