import { defineConfig, devices } from '@playwright/test';

/**
 * E2E test configuration for Shiftlink.
 *
 * Requires the full stack running (see docker-compose.dev.yml):
 *   - PostgreSQL
 *   - Redis
 *   - Backend API (npm run dev)
 *   - Frontend (npm run web:dev or web:build + serve)
 *
 * Start stack:  docker compose -f docker-compose.dev.yml up -d
 * Start API:    npm run dev
 * Start Web:    npm run web:dev
 * Run tests:    npm run test:e2e
 */

const WEB_PORT = process.env.E2E_WEB_PORT || '5173';
const API_PORT = process.env.E2E_API_PORT || '3000';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'list' : [['list']],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: 'npm --prefix web run build && npx serve web/dist -l ' + WEB_PORT,
        url: `http://localhost:${WEB_PORT}`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  metadata: {
    apiUrl: `http://localhost:${API_PORT}`,
  },
});
