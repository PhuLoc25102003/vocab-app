import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { API_DIR, selectE2eDatabase } from './database.mjs';

selectE2eDatabase();
Object.assign(process.env, {
  NODE_ENV: 'test',
  PORT: process.env.E2E_API_PORT,
  CORS_ORIGINS: process.env.E2E_WEB_ORIGIN,
  JWT_ACCESS_SECRET: 'e2e-access-secret-chi-dung-khi-test-0001',
  JWT_REFRESH_SECRET: 'e2e-refresh-secret-chi-dung-khi-test-001',
  GOOGLE_CLIENT_ID: '',
});

// `migrate deploy` tự tạo database nếu chưa có.
const migration = spawnSync('npx prisma migrate deploy', {
  cwd: API_DIR,
  shell: true,
  stdio: 'inherit',
});
if (migration.status !== 0) {
  process.exit(migration.status ?? 1);
}

process.chdir(API_DIR);
await import(pathToFileURL(resolve(API_DIR, 'dist/main.js')).href);
