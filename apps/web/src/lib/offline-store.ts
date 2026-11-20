import type { SetDetail } from '@vocab/shared';

const DB_NAME = 'vocab-offline';
const DB_VERSION = 1;
const SETS = 'sets';

export interface OfflineSet {
  set: SetDetail;
  savedAt: string;
}

export class OfflineStorageError extends Error {
  override name = 'OfflineStorageError';

  constructor(readonly reason: 'unsupported' | 'quota' | 'failed') {
    super(reason);
  }
}

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new OfflineStorageError('unsupported'));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(SETS, { keyPath: 'set.id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new OfflineStorageError('failed'));
  });
}

/** Chạy một thao tác trong transaction và đóng kết nối khi xong. */
async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(SETS, mode);
      const request = action(transaction.objectStore(SETS));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () =>
        reject(
          new OfflineStorageError(
            transaction.error?.name === 'QuotaExceededError' ? 'quota' : 'failed',
          ),
        );
      transaction.onabort = transaction.onerror;
    });
  } finally {
    db.close();
  }
}

export function saveOfflineSet(set: SetDetail, now = new Date()): Promise<IDBValidKey> {
  const entry: OfflineSet = { set, savedAt: now.toISOString() };
  return run('readwrite', (store) => store.put(entry));
}

export async function getOfflineSet(id: string): Promise<OfflineSet | null> {
  return ((await run('readonly', (store) => store.get(id))) as OfflineSet | undefined) ?? null;
}

export async function listOfflineSets(): Promise<OfflineSet[]> {
  const entries = (await run('readonly', (store) => store.getAll())) as OfflineSet[];
  return entries.sort((a, b) => a.set.title.localeCompare(b.set.title, 'vi'));
}

export async function removeOfflineSet(id: string): Promise<void> {
  await run('readwrite', (store) => store.delete(id));
}

/** Xoá mọi dữ liệu offline, gọi khi đăng xuất để máy dùng chung không giữ bộ từ của người khác. */
export async function clearOfflineData(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}
