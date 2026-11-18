import { describe, expect, it } from 'vitest';
import { databaseName, toMaintenanceUrl, toTestDatabaseUrl } from './support/database-url.mjs';

const devUrl = 'postgresql://user:p%40ss@localhost:5433/vocab?schema=public';

describe('database test URL', () => {
  it('thêm hậu tố _test và giữ nguyên phần còn lại', () => {
    expect(toTestDatabaseUrl(devUrl)).toBe(
      'postgresql://user:p%40ss@localhost:5433/vocab_test?schema=public',
    );
  });

  it('không thêm hậu tố lần thứ hai', () => {
    const testUrl = toTestDatabaseUrl(devUrl);
    expect(databaseName(toTestDatabaseUrl(testUrl))).toBe('vocab_test');
  });

  it('dùng database postgres để tạo database test', () => {
    expect(databaseName(toMaintenanceUrl(devUrl))).toBe('postgres');
  });

  it('từ chối tên database không an toàn', () => {
    expect(() => toTestDatabaseUrl('postgresql://u:p@localhost/a%22b')).toThrow();
  });

  it('báo lỗi khi thiếu DATABASE_URL', () => {
    expect(() => toTestDatabaseUrl(undefined)).toThrow('DATABASE_URL');
  });
});
