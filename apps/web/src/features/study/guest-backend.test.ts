import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/lib/http';
import { createGuestBackend } from './guest-backend';

vi.mock('@/lib/http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/http')>()),
  http: vi.fn(),
}));

const card = (id: string, term: string) => ({
  id,
  term,
  definition: `nghĩa ${term}`,
  phonetic: null,
  example: null,
  imageUrl: null,
  audioUrl: null,
  position: 0,
});
const detail = (cards: ReturnType<typeof card>[]) => ({
  data: {
    id: 'set1',
    ownerId: 'u1',
    title: 'Trái cây',
    description: null,
    termLang: 'en',
    defLang: 'vi',
    visibility: 'PUBLIC',
    cardCount: cards.length,
    createdAt: '2026-11-19T00:00:00.000Z',
    updatedAt: '2026-11-19T00:00:00.000Z',
    owner: { displayName: 'Lan' },
    cards,
  },
});
const reply = (questionId: string, value: string) => ({ questionId, value, timeMs: 1 });

describe('createGuestBackend', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chấm tại chỗ và chỉ đọc dữ liệu từ server', async () => {
    vi.mocked(http).mockResolvedValue(detail([card('c1', 'apple'), card('c2', 'pear')]));
    const backend = createGuestBackend();

    const { session, questions } = await backend.start('set1', 'FLASHCARD');
    await backend.submit(session.id, [reply('c1', 'known'), reply('c2', 'unknown')]);
    await backend.submit(session.id, [reply('c2', 'known')]);
    const result = await backend.finish(session.id);

    expect(questions).toHaveLength(2);
    expect(result.session).toMatchObject({ correct: 1, total: 2 });
    expect(result.wrongCardIds).toEqual(['c2']);
    expect(http).toHaveBeenCalledTimes(1);
    expect(http).toHaveBeenCalledWith('/sets/set1', { skipAuth: true });
  });

  it('báo lỗi khi bộ từ chưa có thẻ', async () => {
    vi.mocked(http).mockResolvedValue(detail([]));

    await expect(createGuestBackend().start('set1', 'FLASHCARD')).rejects.toMatchObject({
      code: 'SET_HAS_NO_CARDS',
    });
  });

  it('báo lỗi khi không có thẻ phù hợp với chế độ Điền từ', async () => {
    vi.mocked(http).mockResolvedValue(detail([card('c1', 'apple')]));

    await expect(createGuestBackend().start('set1', 'CLOZE')).rejects.toMatchObject({
      code: 'NO_QUESTIONS_FOR_MODE',
    });
  });

  it('mỗi lần học lại là một phiên mới', async () => {
    vi.mocked(http).mockResolvedValue(detail([card('c1', 'apple')]));
    const backend = createGuestBackend();

    const first = await backend.start('set1', 'FLASHCARD');
    const second = await backend.start('set1', 'FLASHCARD');

    expect(second.session.id).not.toBe(first.session.id);
  });
});
