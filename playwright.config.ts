import { defineConfig, devices } from '@playwright/test';
import { env } from './tests/support/env';

const isCI = Boolean(process.env.CI);
const channel = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: isCI
    ? [
        ['github'],
        ['list'],
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    channel,
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      // Pure HTTP checks: no browser is launched.
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: env.apiUrl },
    },
    {
      name: 'e2e-desktop',
      testDir: './tests/e2e',
      grepInvert: /@mobile/,
      use: { ...devices['Desktop Chrome'], channel, baseURL: env.webUrl },
    },
    {
      name: 'e2e-mobile',
      testDir: './tests/e2e',
      grep: /@mobile/,
      use: { ...devices['Pixel 7'], channel, baseURL: env.webUrl },
    },
  ],
});
