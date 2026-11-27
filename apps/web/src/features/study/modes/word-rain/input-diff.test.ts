import { describe, expect, it } from 'vitest';
import { foldText, readInputChange } from './input-diff';

describe('readInputChange', () => {
  it('lấy các chữ mới gõ thêm ở cuối', () => {
    expect(readInputChange('ap', 'apple')).toEqual({
      kind: 'type',
      chars: ['p', 'l', 'e'],
      fed: 'apple',
    });
  });

  it('bỏ dấu và hoa thường trước khi so', () => {
    expect(foldText('Đường')).toBe('duong');
    expect(readInputChange('', 'Á')).toEqual({ kind: 'type', chars: ['a'], fed: 'a' });
  });

  it('Telex dựng lại chữ (aa thành â) thì không bắn thêm', () => {
    expect(readInputChange('a', 'â')).toEqual({ kind: 'type', chars: [], fed: 'a' });
    expect(readInputChange('nu', 'nư')).toEqual({ kind: 'type', chars: [], fed: 'nu' });
  });

  it('nhận ra khi xoá bớt chữ', () => {
    expect(readInputChange('cat', 'ca')).toEqual({ kind: 'delete', fed: 'ca' });
  });

  it('chữ bị thay ở giữa thì chỉ cập nhật mốc', () => {
    expect(readInputChange('teh', 'the')).toEqual({ kind: 'rewrite', fed: 'the' });
  });
});
