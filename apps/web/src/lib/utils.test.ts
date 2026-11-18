import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('giữ cả cỡ chữ và màu chữ theo token', () => {
    expect(cn('text-small', 'text-primary-fg')).toBe('text-small text-primary-fg');
  });

  it('class sau thay class trước cùng nhóm', () => {
    expect(cn('text-small', 'text-body')).toBe('text-body');
    expect(cn('bg-primary', 'bg-surface')).toBe('bg-surface');
  });

  it('bỏ qua giá trị rỗng', () => {
    expect(cn('px-4', false, undefined, 'py-2')).toBe('px-4 py-2');
  });
});
