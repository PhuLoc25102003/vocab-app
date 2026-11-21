import { describe, expect, it } from 'vitest';
import { ERROR_CODES } from './errors';

describe('ERROR_CODES', () => {
  it('có giá trị trùng với tên mã', () => {
    for (const [name, code] of Object.entries(ERROR_CODES)) {
      expect(code).toBe(name);
    }
  });
});
