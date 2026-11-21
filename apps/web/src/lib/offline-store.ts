import type { SetDetail, StudyMode, UserAnswer } from '@vocab/shared';

const DB_NAME = 'vocab-offline';
const DB_VERSION = 2;
const SETS = 'sets';
/** Phiên học offline chờ gửi lên máy chủ. */
const PENDING = 'pending';

export interface OfflineSet {
  set: SetDetail;
  savedAt: string;
}

export interface PendingSession {
  id?: number;
  setId: string;
  mode: StudyMode;
  /** Đáp án lần đầu của từng câu, `questionId` là id thẻ ở chế độ Flashcard. */
  answers: UserAnswer[];
  finishedAt: string;
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
      const db = request.result;
      if (!db.objectStoreNames.contains(SETS)) {
        db.createObjectStore(SETS, { keyPath: 'set.id' });
      }
      if (!db.objectStoreNames.contains(PENDING)) {
        db.createObjectStore(PENDING, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new OfflineStorageError('failed'));
  });
}

/** Chạy một thao tác trong transaction và đóng kết nối khi xong. */
async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
  storeName: string = SETS,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const request = action(transaction.objectStore(storeName));
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

export function addPendingSession(entry: PendingSession): Promise<IDBValidKey> {
  return run('readwrite', (store) => store.add(entry), PENDING);
}

export async function listPendingSessions(): Promise<PendingSession[]> {
  return (await run('readonly', (store) => store.getAll(), PENDING)) as PendingSession[];
}

export async function removePendingSession(id: number): Promise<void> {
  await run('readwrite', (store) => store.delete(id), PENDING);
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
