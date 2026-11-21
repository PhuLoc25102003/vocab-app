import { describe, expect, it } from 'vitest';
import { safeNextPath } from './next-path';

describe('safeNextPath', () => {
  it('giữ đường dẫn trong app', () => {
    expect(safeNextPath('/sets?page=2#cuoi')).toBe('/sets?page=2#cuoi');
  });

  it.each([
    null,
    '',
    'sets',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/\t/evil.example',
  ])('về trang mặc định với %j', (value) => {
    expect(safeNextPath(value)).toBe('/dashboard');
  });
});
