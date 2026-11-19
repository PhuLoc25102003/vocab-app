import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const API_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../api');
const E2E_DATABASE = 'vocab_e2e';

/** Dùng cùng máy chủ Postgres nhưng database riêng, không đụng dữ liệu dev. */
export function useE2eDatabase() {
  try {
    process.loadEnvFile(resolve(API_DIR, '.env'));
  } catch {
    // CI truyền biến môi trường trực tiếp, không có file .env.
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('Thiếu DATABASE_URL');
  }
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `/${E2E_DATABASE}`;
  process.env.DATABASE_URL = url.toString();
}
