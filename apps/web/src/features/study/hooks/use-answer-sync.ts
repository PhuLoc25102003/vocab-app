import { useCallback, useRef } from 'react';
import type { StudyBackend } from '../api';
import { useStudyStore } from '../session.store';

/** Request `keepalive` bị giới hạn 64 KB, mỗi đáp án tối đa 500 ký tự. */
const SYNC_BATCH_SIZE = 20;

async function drain(backend: StudyBackend): Promise<void> {
  for (;;) {
    const { session, pending } = useStudyStore.getState();
    if (!session || pending.length === 0) {
      return;
    }
    const batch = pending.slice(0, SYNC_BATCH_SIZE);
    await backend.submit(session.id, batch);
    useStudyStore.getState().acknowledge(session.id, batch.length);
  }
}

/** Gửi lần lượt từng lô. Lô lỗi vẫn nằm trong store để lần sau gửi lại. */
export function useAnswerSync(backend: StudyBackend): () => Promise<void> {
  const running = useRef<Promise<void> | null>(null);

  return useCallback(() => {
    running.current ??= drain(backend).finally(() => {
      running.current = null;
    });
    return running.current;
  }, [backend]);
}
