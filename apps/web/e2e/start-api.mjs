import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const API_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../api');
const E2E_DATABASE = 'vocab_e2e';

function loadDevEnv() {
  try {
    process.loadEnvFile(resolve(API_DIR, '.env'));
  } catch {
    // CI truyền biến môi trường trực tiếp, không có file .env.
  }
}

/** Dùng cùng máy chủ Postgres nhưng database riêng, không đụng dữ liệu dev. */
function e2eDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Thiếu DATABASE_URL');
  }
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `/${E2E_DATABASE}`;
  return url.toString();
}

loadDevEnv();
Object.assign(process.env, {
  DATABASE_URL: e2eDatabaseUrl(),
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
