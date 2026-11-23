require('dotenv').config();
const { defineConfig } = require('@playwright/test');

const rawBaseUrl = process.env.BASE_URL;
const baseUrl = rawBaseUrl
  ? (rawBaseUrl.endsWith('/') ? rawBaseUrl : rawBaseUrl + '/')
  : undefined;

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }], ['json', { outputFile: 'reports/playwright-results.json' }]],
  use: {
    baseURL: baseUrl,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'off',
    video: 'off',
    actionTimeout: 15000,
    navigationTimeout: 30000
  }
});