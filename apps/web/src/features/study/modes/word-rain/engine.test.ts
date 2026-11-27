import { describe, expect, it } from 'vitest';
import {
  comboMultiplier,
  createGame,
  RAIN_RULES,
  releaseLock,
  setPaused,
  speak,
  tick,
  typeChar,
  type RainQuestion,
  type RainState,
} from './engine';

const questions: RainQuestion[] = [
  { id: 'q1', prompt: 'quả táo', expected: 'apple' },
  { id: 'q2', prompt: 'quả bơ', expected: 'avocado' },
  { id: 'q3', prompt: 'kem', expected: 'ice cream' },
];
/** Ngẫu nhiên cố định để test lặp lại được; mục tiêu luôn ở sát lề trái. */
const random = () => 0;

/** Chạy tới khi có đủ `count` mục tiêu trên màn hình. */
function spawnTargets(state: RainState, count: number): RainState {
  let next = state;
  for (let step = 0; step < 500 && next.targets.length < count; step += 1) {
    next = tick(next, 100, random);
  }
  return next;
}

const typeWord = (state: RainState, word: string) =>
  [...word].reduce((current, char) => typeChar(current, char), state);

describe('Mưa từ: lõi trò chơi', () => {
  it('sinh mục tiêu theo thời gian và cho rơi xuống', () => {
    const game = spawnTargets(createGame(questions, 'TYPE', random), 1);
    expect(game.targets).toHaveLength(1);
    const later = tick(game, 100, random);
    expect(later.targets[0]!.y).toBeGreaterThan(game.targets[0]!.y);
  });

  it('gõ chữ đầu khoá mục tiêu khớp, gõ đủ thì bắn hạ và cộng điểm', () => {
    const game = spawnTargets(createGame(questions, 'TYPE', random), 1);
    const target = game.targets[0]!;
    const locked = typeChar(game, target.answer[0]!);
    expect(locked.lockedKey).toBe(target.key);
    expect(locked.events).toContainEqual({ type: 'lock', key: target.key });

    const done = typeWord(locked, target.answer.slice(1));
    expect(done.targets).toHaveLength(0);
    expect(done.score).toBe(target.answer.length * RAIN_RULES.pointsPerChar);
    expect(done.results).toEqual([
      expect.objectContaining({
        questionId: target.questionId,
        value: target.answer,
        isCorrect: true,
      }),
    ]);
  });

  it('khoá mục tiêu gần đất nhất khi nhiều từ cùng chữ đầu', () => {
    const game = spawnTargets(createGame(questions.slice(0, 2), 'TYPE', random), 2);
    const [older, newer] = game.targets;
    expect(older!.answer[0]).toBe('a');
    expect(newer!.answer[0]).toBe('a');
    expect(typeChar(game, 'a').lockedKey).toBe(older!.key);
  });

  it('gõ sai làm mất combo, bỏ khoá thì gõ lại từ đầu', () => {
    let game = spawnTargets(createGame(questions, 'TYPE', random), 1);
    game = { ...game, combo: 7 };
    const wrong = typeChar(typeChar(game, 'a'), 'x');
    expect(wrong.combo).toBe(0);
    expect(wrong.events).toContainEqual({ type: 'wrong' });
    const released = releaseLock(wrong);
    expect(released.lockedKey).toBeNull();
    expect(released.targets[0]!.typed).toBe(0);
  });

  it('mục tiêu chạm đất mất một khiên và ghi đáp án rỗng; hết khiên thì thua', () => {
    let game = spawnTargets(createGame(questions, 'TYPE', random), 1);
    for (let step = 0; step < 400 && game.shields === RAIN_RULES.shields; step += 1) {
      game = tick(game, 100, random);
    }
    expect(game.shields).toBe(RAIN_RULES.shields - 1);
    expect(game.results[0]).toMatchObject({ value: '', isCorrect: false });
    const over = tick(
      { ...game, shields: 1, targets: game.targets.map((t) => ({ ...t, y: 0.999 })) },
      100,
      random,
    );
    expect(over.status).toBe('over');
  });

  it('bắn hạ hết mọi câu thì thắng', () => {
    let game = createGame([questions[0]!], 'TYPE', random);
    game = spawnTargets(game, 1);
    game = typeWord(game, 'apple');
    expect(game.status).toBe('won');
  });

  it('kiểu Nói bắn mục tiêu khớp câu nhận dạng, tiếng ồn không trừ combo', () => {
    let game = spawnTargets(createGame(questions, 'SPEAK', random), 3);
    game = { ...game, combo: 3 };
    const noise = speak(game, 'hello world');
    expect(noise.targets).toHaveLength(3);
    expect(noise.combo).toBe(3);

    const hit = speak(game, 'Ice cream');
    expect(hit.targets.map(({ questionId }) => questionId)).not.toContain('q3');
    expect(hit.results.at(-1)).toMatchObject({
      questionId: 'q3',
      value: 'spoken:Ice cream',
      isCorrect: true,
    });
  });

  it('kiểu Nói rơi chậm hơn kiểu Gõ', () => {
    const typed = spawnTargets(createGame(questions, 'TYPE', random), 1);
    const spoken = spawnTargets(createGame(questions, 'SPEAK', random), 1);
    expect(spoken.targets[0]!.speed).toBeLessThan(typed.targets[0]!.speed);
  });

  it('mục tiêu lớn cuối đợt 3 là từ dài nhất và cần gõ hai lần', () => {
    let game: RainState = {
      ...createGame(questions, 'TYPE', random),
      wave: 3,
      spawnedInWave: RAIN_RULES.waveSize - 1,
    };
    game = spawnTargets(game, 1);
    const boss = game.targets[0]!;
    expect(boss).toMatchObject({ boss: true, hits: 2, answer: 'ice cream' });
    game = typeWord(game, 'ice cream');
    expect(game.targets[0]).toMatchObject({ key: boss.key, hits: 1, typed: 0 });
    game = typeWord(game, 'ice cream');
    expect(game.targets).toHaveLength(0);
    expect(game.events).toContainEqual(expect.objectContaining({ type: 'destroy', boss: true }));
  });

  it('tạm dừng thì không rơi', () => {
    const game = setPaused(spawnTargets(createGame(questions, 'TYPE', random), 1), true);
    expect(tick(game, 100, random).targets[0]!.y).toBe(game.targets[0]!.y);
  });

  it('combo nhân điểm theo mốc', () => {
    expect([0, 4, 5, 9, 10, 19, 20].map(comboMultiplier)).toEqual([1, 1, 2, 2, 3, 3, 4]);
  });
});
