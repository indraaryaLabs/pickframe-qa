import { expect, type Page } from '@playwright/test';
import { env } from './env';

export interface PageProblems {
  consoleErrors: string[];
  pageErrors: string[];
  /** Requests to the product's own web and API origins that never completed. */
  failedRequests: string[];
  /** Requests to other hosts (fonts, analytics). Reported, but outside the product's control. */
  thirdPartyFailures: string[];
}

const firstPartyOrigins = new Set([new URL(env.webUrl).origin, new URL(env.apiUrl).origin]);

/**
 * Starts collecting problems a visitor would hit silently: console errors,
 * uncaught exceptions and requests that never completed. Call before navigating.
 */
export function watchProblems(page: Page): PageProblems {
  const problems: PageProblems = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    thirdPartyFailures: [],
  };

  page.on('console', (message) => {
    if (message.type() === 'error') problems.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => problems.pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    const reason = request.failure()?.errorText ?? 'unknown';
    // Navigations that are superseded by the next one are not defects.
    if (reason === 'net::ERR_ABORTED') return;
    const entry = `${request.method()} ${request.url()} (${reason})`;
    if (firstPartyOrigins.has(new URL(request.url()).origin)) problems.failedRequests.push(entry);
    else problems.thirdPartyFailures.push(entry);
  });

  return problems;
}

/** Random URL-safe token that cannot collide with a real magic link. */
export function randomToken(prefix = 'qa'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
}

/**
 * Navigates and waits until the single-page app has rendered something real.
 * Pages are code-split, so a bare `goto` can return while only the loader is on screen.
 */
export async function openAndSettle(page: Page, path: string) {
  const response = await page.goto(path);
  await expect(page.getByRole('heading').first()).toBeVisible();
  return response;
}

/**
 * Resolves with the document title after it has stayed unchanged for `quietMs`. Titles are set by
 * the app after it renders, so a single read can catch the static fallback instead of the final one.
 */
export async function stableTitle(page: Page, quietMs = 300): Promise<string> {
  return page.evaluate(
    (quiet) =>
      new Promise<string>((resolve) => {
        let timer = window.setTimeout(done, quiet);
        const observer = new MutationObserver(() => {
          window.clearTimeout(timer);
          timer = window.setTimeout(done, quiet);
        });
        observer.observe(document.head, { subtree: true, childList: true, characterData: true });
        function done() {
          observer.disconnect();
          resolve(document.title);
        }
      }),
    quietMs,
  );
}
