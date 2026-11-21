import { describe, expect, it } from 'vitest';
import manifest from './manifest';

describe('manifest', () => {
  it('đủ thông tin để cài lên thiết bị', () => {
    const value = manifest();

    expect(value).toMatchObject({ display: 'standalone', start_url: '/dashboard', lang: 'vi' });
    expect(value.icons?.map(({ sizes }) => sizes)).toEqual(['192x192', '512x512', '512x512']);
    expect(value.icons?.some(({ purpose }) => purpose === 'maskable')).toBe(true);
  });
});
