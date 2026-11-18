import { describe, expect, it } from 'vitest';
import { PASSWORD_MAX_LENGTH, registerSchema } from './auth';

const valid = { email: 'an@example.com', password: 'mat-khau-dai', displayName: 'An' };

describe('registerSchema', () => {
  it('chuẩn hoá email và tên hiển thị', () => {
    const result = registerSchema.parse({
      ...valid,
      email: '  An@Example.COM ',
      displayName: '  An  ',
    });
    expect(result.email).toBe('an@example.com');
    expect(result.displayName).toBe('An');
  });

  it('giữ nguyên khoảng trắng trong mật khẩu', () => {
    expect(registerSchema.parse({ ...valid, password: ' mat khau ' }).password).toBe(' mat khau ');
  });

  it('bỏ các trường không được khai báo', () => {
    expect(registerSchema.parse({ ...valid, role: 'ADMIN' })).not.toHaveProperty('role');
  });

  it.each([
    ['email sai', { email: 'khong-phai-email' }],
    ['mật khẩu ngắn', { password: '1234567' }],
    ['mật khẩu quá dài', { password: 'a'.repeat(PASSWORD_MAX_LENGTH + 1) }],
    ['tên rỗng', { displayName: '   ' }],
    ['tên có ký tự điều khiển', { displayName: 'A\u0000B' }],
  ])('từ chối %s', (_name, change) => {
    expect(registerSchema.safeParse({ ...valid, ...change }).success).toBe(false);
  });
});
