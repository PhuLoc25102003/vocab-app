import { describe, expect, it } from 'vitest';
import { ok, paginated, toSkipTake } from '../src/common/base/pagination';

const query = { page: 3, limit: 50, sort: '-updatedAt' };

describe('pagination helpers', () => {
  it('ok() bọc dữ liệu trong data', () => {
    expect(ok({ id: 'a' })).toEqual({ data: { id: 'a' } });
  });

  it('paginated() trả data và meta', () => {
    expect(paginated(['a'], 135, query)).toEqual({
      data: ['a'],
      meta: { page: 3, limit: 50, total: 135 },
    });
  });

  it('toSkipTake() tính vị trí bắt đầu theo trang', () => {
    expect(toSkipTake(query)).toEqual({ skip: 100, take: 50 });
    expect(toSkipTake({ ...query, page: 1 })).toEqual({ skip: 0, take: 50 });
  });
});
