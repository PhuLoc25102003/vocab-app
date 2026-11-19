import { describe, expect, it } from 'vitest';
import { parseTrustedProxies } from '../src/config/env';

describe('parseTrustedProxies', () => {
  it('để trống thì không tin proxy nào', () => {
    expect(parseTrustedProxies('')).toBe(false);
    expect(parseTrustedProxies(' , ')).toBe(false);
  });

  it('nhận danh sách IP hoặc CIDR', () => {
    expect(parseTrustedProxies('10.0.0.0/8, 127.0.0.1')).toEqual(['10.0.0.0/8', '127.0.0.1']);
  });

  it('nhận số tầng proxy khi IP của proxy thay đổi', () => {
    const trust = parseTrustedProxies('2');

    expect(typeof trust).toBe('function');
    expect(typeof parseTrustedProxies(' 12 ')).toBe('function');
    expect(parseTrustedProxies('2d')).toEqual(['2d']);
    if (typeof trust === 'function') {
      expect([0, 1, 2].map((hop) => trust('203.0.113.1', hop))).toEqual([true, true, false]);
    }
  });
});
