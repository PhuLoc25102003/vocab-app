const TEST_SUFFIX = '_test';

function parseDatabaseUrl(value: string | undefined): URL {
  if (!value) {
    throw new Error('Thiếu DATABASE_URL. Tạo apps/api/.env từ apps/api/.env.example.');
  }
  return new URL(value);
}

export function databaseName(value: string): string {
  return decodeURIComponent(new URL(value).pathname.slice(1));
}

export function isTestDatabaseName(name: string): boolean {
  return name.endsWith(TEST_SUFFIX);
}

/** Đổi `vocab` thành `vocab_test` để test không bao giờ chạm vào database dev. */
export function toTestDatabaseUrl(value: string | undefined): string {
  const url = parseDatabaseUrl(value);
  const name = databaseName(url.href);
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(`Tên database không hợp lệ: ${name}`);
  }
  if (!isTestDatabaseName(name)) {
    url.pathname = `/${name}${TEST_SUFFIX}`;
  }
  return url.href;
}

/** Database có sẵn của PostgreSQL, dùng để tạo database test. */
export function toMaintenanceUrl(value: string | undefined): string {
  const url = parseDatabaseUrl(value);
  url.pathname = '/postgres';
  return url.href;
}
