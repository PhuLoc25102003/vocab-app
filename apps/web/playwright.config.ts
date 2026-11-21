import { defineConfig, devices } from '@playwright/test';

// Cổng riêng để chạy được khi `npm run dev` đang mở.
const API_PORT = 4100;
const WEB_PORT = 3100;
const WEB_ORIGIN = `http://localhost:${WEB_PORT}`;
const API_ORIGIN = `http://localhost:${API_PORT}`;

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  // Các bước dùng chung một tài khoản và giới hạn đăng ký chỉ cho vài lần mỗi phút.
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: WEB_ORIGIN, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/start-api.mjs',
      url: `${API_ORIGIN}/api/v1/health`,
      env: { E2E_API_PORT: String(API_PORT), E2E_WEB_ORIGIN: WEB_ORIGIN },
      timeout: 120_000,
      reuseExistingServer: false,
    },
    {
      command: `npx next build && npx next start -p ${WEB_PORT}`,
      url: WEB_ORIGIN,
      env: { NEXT_PUBLIC_API_URL: `${API_ORIGIN}/api/v1`, NEXT_PUBLIC_GOOGLE_CLIENT_ID: '' },
      timeout: 300_000,
      reuseExistingServer: false,
    },
  ],
});
