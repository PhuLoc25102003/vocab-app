import { listPendingSessions, removePendingSession } from '@/lib/offline-store';
import { HttpError } from '@/lib/http';
import type { StudyBackend } from './api';

/** API nhận tối đa 200 đáp án mỗi lô. */
const ANSWER_BATCH = 200;
/** Lỗi không thể đồng bộ được nữa: bộ đã xoá, không còn quyền xem hoặc không còn thẻ. */
const UNRECOVERABLE = new Set([403, 404, 422]);

export interface SyncResult {
  synced: number;
  dropped: number;
  remaining: number;
}

/**
 * Gửi các phiên học offline lên máy chủ: tạo phiên với đúng các thẻ đã học, gửi đáp án,
 * kết thúc rồi xoá khỏi hàng đợi. Lỗi mạng thì giữ lại để lần sau gửi tiếp.
 */
export async function syncPendingSessions(backend: StudyBackend): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, dropped: 0, remaining: 0 };
  for (const pending of await listPendingSessions()) {
    if (pending.id === undefined) continue;
    try {
      const cardIds = pending.answers.map(({ questionId }) => questionId);
      const started = await backend.start(pending.setId, pending.mode, { cardIds });
      const known = new Set(started.questions.map(({ id }) => id));
      // Thẻ đã bị xoá khi đang offline thì bỏ đáp án của thẻ đó.
      const answers = pending.answers.filter(({ questionId }) => known.has(questionId));
      for (let index = 0; index < answers.length; index += ANSWER_BATCH) {
        await backend.submit(started.session.id, answers.slice(index, index + ANSWER_BATCH));
      }
      await backend.finish(started.session.id);
      await removePendingSession(pending.id);
      result.synced += 1;
    } catch (error) {
      if (error instanceof HttpError && UNRECOVERABLE.has(error.status)) {
        await removePendingSession(pending.id);
        result.dropped += 1;
      } else {
        result.remaining += 1;
      }
    }
  }
  return result;
}
