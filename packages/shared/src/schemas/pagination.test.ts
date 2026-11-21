import { describe, expect, it } from 'vitest';
import { MAX_PAGE, paginationSchema } from './pagination';

describe('paginationSchema', () => {
  it('dùng giá trị mặc định khi không truyền tham số', () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 20, sort: '-updatedAt' });
  });

  it('chuyển chuỗi trong query thành số', () => {
    expect(paginationSchema.parse({ page: '3', limit: '50' })).toMatchObject({
      page: 3,
      limit: 50,
    });
  });

  it('chấp nhận limit tối đa 100', () => {
    expect(paginationSchema.parse({ limit: 100 }).limit).toBe(100);
  });

  it.each([
    ['limit lớn hơn 100', { limit: 101 }],
    ['limit bằng 0', { limit: 0 }],
    ['page bằng 0', { page: 0 }],
    ['page không phải số', { page: 'abc' }],
    ['page không nguyên', { page: 1.5 }],
    ['sort quá dài', { sort: 'a'.repeat(51) }],
  ])('từ chối %s', (_name, input) => {
    expect(paginationSchema.safeParse(input).success).toBe(false);
  });
});

describe('giới hạn số trang', () => {
  it('từ chối số trang quá lớn', () => {
    expect(paginationSchema.safeParse({ page: MAX_PAGE }).success).toBe(true);
    expect(paginationSchema.safeParse({ page: MAX_PAGE + 1 }).success).toBe(false);
  });
});
