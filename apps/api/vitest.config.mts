import 'dotenv/config';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import { toTestDatabaseUrl } from './test/support/database-url.mjs';

export default defineConfig({
  // SWC sinh metadata của decorator mà NestJS cần để inject dependency.
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/support/global-setup.ts'],
    // Các file integration dùng chung một database.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: toTestDatabaseUrl(process.env.DATABASE_URL),
      JWT_ACCESS_SECRET: 'test-only-access-secret-at-least-32-chars',
      JWT_REFRESH_SECRET: 'test-only-refresh-secret-at-least-32-chars',
      GOOGLE_CLIENT_ID: 'test-google-client-id',
    },
  },
});
