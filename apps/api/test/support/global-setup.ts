import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { databaseName, toMaintenanceUrl, toTestDatabaseUrl } from './database-url.mjs';

async function ensureDatabase(maintenanceUrl: string, name: string): Promise<void> {
  const client = new Client({ connectionString: maintenanceUrl });
  try {
    await client.connect();
  } catch (cause) {
    throw new Error('Không kết nối được PostgreSQL. Chạy `npm run db:up` rồi thử lại.', { cause });
  }

  try {
    const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (existing.rowCount === 0) {
      // Tên đã được kiểm tra trong toTestDatabaseUrl. CREATE DATABASE không nhận tham số.
      await client.query(`CREATE DATABASE "${name}"`);
    }
  } finally {
    await client.end();
  }
}

export default async function setup(): Promise<void> {
  const testUrl = toTestDatabaseUrl(process.env.DATABASE_URL);
  await ensureDatabase(toMaintenanceUrl(process.env.DATABASE_URL), databaseName(testUrl));

  execSync('npx prisma migrate deploy', {
    cwd: resolve(import.meta.dirname, '../..'),
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'pipe',
  });
}
