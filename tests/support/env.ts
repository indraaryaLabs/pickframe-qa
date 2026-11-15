const trimTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

/**
 * Deployment under test. The defaults point at production; override with
 * PICKFRAME_WEB_URL / PICKFRAME_API_URL to aim the same suite at a preview.
 */
export const env = {
  webUrl: trimTrailingSlash(process.env.PICKFRAME_WEB_URL ?? 'https://pickframe.satuarah.click'),
  apiUrl: trimTrailingSlash(
    process.env.PICKFRAME_API_URL ?? 'https://api-pickframe.satuarah.click',
  ),
} as const;

/** Origin the API must accept for credentialed browser calls. */
export const allowedOrigin: string =
  process.env.PICKFRAME_ALLOWED_ORIGIN ?? new URL(env.webUrl).origin;

/** The companion app (PickFrame Select) is allow-listed by name in the API. */
export const selectOrigin = 'https://select-pickframe.satuarah.click';

/** True when the suite is pointed at a machine-local server rather than a deployment. */
export const isLocalTarget = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(env.webUrl);
