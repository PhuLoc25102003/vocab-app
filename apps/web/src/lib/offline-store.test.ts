import 'fake-indexeddb/auto';
import type { SetDetail } from '@vocab/shared';
import { afterEach, describe, expect, it } from 'vitest';
import {
  clearOfflineData,
  getOfflineSet,
  listOfflineSets,
  removeOfflineSet,
  saveOfflineSet,
} from './offline-store';

const set = (id: string, title: string) =>
  ({
    id,
    title,
    ownerId: 'u1',
    description: null,
    termLang: 'en',
    defLang: 'vi',
    visibility: 'PRIVATE',
    cardCount: 1,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    owner: { displayName: 'An' },
    cards: [{ id: 'c1', position: 0, term: 'apple', definition: 'quả táo' }],
  }) as unknown as SetDetail;

describe('offline-store', () => {
  afterEach(() => clearOfflineData());

  it('lưu, đọc, liệt kê theo tên và xoá bộ từ', async () => {
    await saveOfflineSet(set('s2', 'Trái cây'), new Date('2026-11-20T00:00:00Z'));
    await saveOfflineSet(set('s1', 'Động vật'));

    expect(await getOfflineSet('s2')).toMatchObject({
      set: { id: 's2', title: 'Trái cây' },
      savedAt: '2026-11-20T00:00:00.000Z',
    });
    expect((await listOfflineSets()).map(({ set: { title } }) => title)).toEqual([
      'Động vật',
      'Trái cây',
    ]);

    await removeOfflineSet('s2');
    expect(await getOfflineSet('s2')).toBeNull();
  });

  it('lưu lại thì ghi đè bản cũ, xoá hết khi đăng xuất', async () => {
    await saveOfflineSet(set('s1', 'Cũ'));
    await saveOfflineSet(set('s1', 'Mới'));
    expect(await listOfflineSets()).toHaveLength(1);
    expect((await getOfflineSet('s1'))?.set.title).toBe('Mới');

    await clearOfflineData();
    expect(await listOfflineSets()).toEqual([]);
  });
});
