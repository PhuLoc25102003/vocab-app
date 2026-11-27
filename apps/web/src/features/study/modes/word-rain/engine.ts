import { gradeSpokenText, WORD_RAIN_SPOKEN_PREFIX, type WordRainStyle } from '@vocab/shared';

/**
 * Lõi trò chơi Mưa từ: hàm thuần, không React, không canvas, không đọc đồng hồ. Mỗi khung hình
 * gọi `tick` với số mili giây trôi qua; ngẫu nhiên đi qua tham số `random` để test được.
 * Toạ độ chuẩn hoá: `x` từ 0 (trái) đến 1 (phải), `y` từ 0 (đỉnh) đến 1 (mặt đất).
 */

export interface RainQuestion {
  id: string;
  prompt: string;
  expected: string;
}

export interface Target {
  key: number;
  questionId: string;
  prompt: string;
  /** Đáp án gốc (gộp khoảng trắng). Chỉ chữ và số phải gõ; dấu câu, khoảng trắng tự điền. */
  answer: string;
  x: number;
  y: number;
  /** Đơn vị chiều cao mỗi giây. */
  speed: number;
  boss: boolean;
  /** Mục tiêu lớn cần gõ đủ 2 lần. */
  hits: number;
  /** Vị trí ký tự kế tiếp cần gõ trong `answer` của lần hiện tại. */
  typed: number;
  spawnedAt: number;
}

export interface RainResult {
  questionId: string;
  value: string;
  isCorrect: boolean;
  timeMs: number;
}

export type RainEvent =
  | { type: 'lock'; key: number }
  | { type: 'shot'; key: number }
  | { type: 'hit'; key: number }
  | { type: 'destroy'; key: number; boss: boolean; points: number }
  | { type: 'wrong' }
  | { type: 'miss'; key: number }
  | { type: 'wave'; wave: number };

export type RainStatus = 'playing' | 'paused' | 'over' | 'won';

export interface RainState {
  style: WordRainStyle;
  status: RainStatus;
  questions: readonly RainQuestion[];
  /** Câu chưa rơi trong vòng hiện tại; hết thì trộn lại câu chưa bắn được. */
  queue: string[];
  /** Câu đã bắn hạ ít nhất một lần. */
  cleared: string[];
  targets: Target[];
  nextKey: number;
  wave: number;
  spawnedInWave: number;
  /** Số lần mỗi câu đã rơi trong đợt hiện tại. */
  waveCounts: Record<string, number>;
  spawnIn: number;
  clock: number;
  shields: number;
  score: number;
  combo: number;
  bestCombo: number;
  lockedKey: number | null;
  results: RainResult[];
  /** Sự kiện của lần cập nhật gần nhất, cho hiệu ứng và âm thanh; mỗi lần cập nhật làm mới. */
  events: RainEvent[];
}

export const RAIN_RULES = {
  shields: 3,
  waveSize: 10,
  /** Cuối mỗi bấy nhiêu đợt có một mục tiêu lớn. */
  bossEvery: 3,
  bossHits: 2,
  maxPerWave: 2,
  maxOnScreen: 3,
  /** Thời gian rơi từ đỉnh xuống đất (giây) ở đợt 1, giảm dần theo đợt. Nói chậm hơn để bù độ trễ nhận dạng. */
  fallSeconds: { TYPE: 16, SPEAK: 20 },
  minFallSeconds: { TYPE: 8, SPEAK: 11 },
  fallStep: 0.5,
  spawnSeconds: 4.5,
  minSpawnSeconds: 2.2,
  spawnStep: 0.2,
  bossSlowdown: 1.4,
  pointsPerChar: 10,
  bossBonus: 100,
} as const;

/** Combo 0-4 nhân 1, 5-9 nhân 2, 10-19 nhân 3, từ 20 nhân 4. */
export function comboMultiplier(combo: number): number {
  if (combo >= 20) return 4;
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  return 1;
}

const TYPEABLE = /[\p{L}\p{N}]/u;

/** Chữ và số phải gõ; khoảng trắng, gạch nối, gạch chéo, ngoặc... được tự điền. */
export function isTypeable(char: string): boolean {
  return TYPEABLE.test(char);
}

/** So ký tự không phân biệt hoa thường và dấu: gõ `e` khớp `é`, gõ `d` khớp `đ`. */
export function foldChar(char: string): string {
  return char.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/đ/g, 'd');
}

/** Vị trí ký tự cần gõ đầu tiên tính từ `from`, bỏ qua ký tự tự điền. */
export function nextTypeable(answer: string, from: number): number {
  let index = from;
  while (index < answer.length && !isTypeable(answer[index]!)) index += 1;
  return index;
}

const typeableLength = (answer: string) => [...answer].filter(isTypeable).length;

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap]!, copy[index]!];
  }
  return copy;
}

const fallSeconds = (state: RainState) =>
  Math.max(
    RAIN_RULES.minFallSeconds[state.style],
    RAIN_RULES.fallSeconds[state.style] - (state.wave - 1) * RAIN_RULES.fallStep,
  );

const spawnSeconds = (wave: number) =>
  Math.max(RAIN_RULES.minSpawnSeconds, RAIN_RULES.spawnSeconds - (wave - 1) * RAIN_RULES.spawnStep);

export function createGame(
  questions: readonly RainQuestion[],
  style: WordRainStyle,
  random: () => number,
): RainState {
  return {
    style,
    status: 'playing',
    questions,
    queue: shuffle(
      questions.map(({ id }) => id),
      random,
    ),
    cleared: [],
    targets: [],
    nextKey: 1,
    wave: 1,
    spawnedInWave: 0,
    waveCounts: {},
    spawnIn: 0.5,
    clock: 0,
    shields: RAIN_RULES.shields,
    score: 0,
    combo: 0,
    bestCombo: 0,
    lockedKey: null,
    results: [],
    events: [],
  };
}

/** Câu tiếp theo được phép rơi trong đợt này (không quá 2 lần một đợt, không trùng câu đang rơi). */
function takeNext(
  state: RainState,
  random: () => number,
  preferLongest: boolean,
): RainQuestion | null {
  const onScreen = new Set(state.targets.map(({ questionId }) => questionId));
  const allowed = (id: string) =>
    !onScreen.has(id) && (state.waveCounts[id] ?? 0) < RAIN_RULES.maxPerWave;
  if (state.queue.length === 0) {
    const remaining = state.questions
      .map(({ id }) => id)
      .filter((id) => !state.cleared.includes(id));
    state.queue = shuffle(remaining.length > 0 ? remaining : [], random);
  }
  let index = state.queue.findIndex(allowed);
  if (preferLongest) {
    const byLength = state.queue
      .map((id, position) => ({ id, position }))
      .filter(({ id }) => allowed(id))
      .sort(
        (a, b) =>
          (state.questions.find(({ id }) => id === b.id)?.expected.length ?? 0) -
          (state.questions.find(({ id }) => id === a.id)?.expected.length ?? 0),
      );
    index = byLength[0]?.position ?? -1;
  }
  if (index < 0) return null;
  const [id] = state.queue.splice(index, 1);
  return state.questions.find((question) => question.id === id) ?? null;
}

function spawn(state: RainState, random: () => number): void {
  const isBoss =
    state.wave % RAIN_RULES.bossEvery === 0 && state.spawnedInWave === RAIN_RULES.waveSize - 1;
  const question = takeNext(state, random, isBoss);
  if (!question) return;
  const speed = 1 / (fallSeconds(state) * (isBoss ? RAIN_RULES.bossSlowdown : 1));
  const answer = question.expected.normalize('NFC').replace(/\s+/g, ' ').trim();
  state.targets.push({
    key: state.nextKey,
    questionId: question.id,
    prompt: question.prompt,
    answer,
    // Chừa lề để thẻ nghĩa không chạm mép khung.
    x: 0.12 + random() * 0.76,
    y: 0,
    speed,
    boss: isBoss,
    hits: isBoss ? RAIN_RULES.bossHits : 1,
    typed: nextTypeable(answer, 0),
    spawnedAt: state.clock,
  });
  state.nextKey += 1;
  state.spawnedInWave += 1;
  state.waveCounts[question.id] = (state.waveCounts[question.id] ?? 0) + 1;
  if (state.spawnedInWave >= RAIN_RULES.waveSize) {
    state.wave += 1;
    state.spawnedInWave = 0;
    state.waveCounts = {};
    state.events.push({ type: 'wave', wave: state.wave });
  }
}

function clone(state: RainState): RainState {
  return {
    ...state,
    queue: [...state.queue],
    cleared: [...state.cleared],
    targets: state.targets.map((target) => ({ ...target })),
    waveCounts: { ...state.waveCounts },
    results: [...state.results],
    events: [],
  };
}

function finishIfDone(state: RainState): void {
  if (state.shields <= 0) {
    state.status = 'over';
  } else if (
    state.cleared.length >= state.questions.length &&
    state.targets.length === 0 &&
    state.questions.length > 0
  ) {
    state.status = 'won';
  }
}

/** Cập nhật `dtMs` mili giây: rơi, chạm đất mất khiên, sinh mục tiêu mới. */
export function tick(previous: RainState, dtMs: number, random: () => number): RainState {
  if (previous.status !== 'playing') return { ...previous, events: [] };
  const state = clone(previous);
  // Tab ngủ rồi quay lại không được nhảy cóc quá xa.
  const dt = Math.min(dtMs, 100) / 1000;
  state.clock += dt * 1000;

  for (const target of state.targets) {
    target.y += target.speed * dt;
  }
  const landed = state.targets.filter(({ y }) => y >= 1);
  for (const target of landed) {
    state.shields -= 1;
    state.combo = 0;
    state.events.push({ type: 'miss', key: target.key });
    state.results.push({
      questionId: target.questionId,
      value: '',
      isCorrect: false,
      timeMs: Math.round(state.clock - target.spawnedAt),
    });
    // Câu bị lọt quay lại hàng chờ để người học gặp lại.
    state.queue.push(target.questionId);
    if (state.lockedKey === target.key) state.lockedKey = null;
  }
  state.targets = state.targets.filter(({ y }) => y < 1);

  state.spawnIn -= dt;
  if (state.spawnIn <= 0 && state.targets.length < RAIN_RULES.maxOnScreen) {
    spawn(state, random);
    state.spawnIn = spawnSeconds(state.wave);
  }
  finishIfDone(state);
  return state;
}

function destroy(state: RainState, target: Target, value: string): void {
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const points =
    typeableLength(target.answer) * RAIN_RULES.pointsPerChar * comboMultiplier(state.combo) +
    (target.boss ? RAIN_RULES.bossBonus : 0);
  state.score += points;
  state.events.push({ type: 'destroy', key: target.key, boss: target.boss, points });
  state.results.push({
    questionId: target.questionId,
    value,
    isCorrect: true,
    timeMs: Math.round(state.clock - target.spawnedAt),
  });
  if (!state.cleared.includes(target.questionId)) state.cleared.push(target.questionId);
  state.targets = state.targets.filter(({ key }) => key !== target.key);
  if (state.lockedKey === target.key) state.lockedKey = null;
}

/**
 * Kiểu Gõ: một ký tự. Chưa khoá thì khoá mục tiêu khớp gần đất nhất; gõ đủ thì bắn hạ.
 * Khoảng trắng và dấu câu người chơi gõ được bỏ qua, không tính sai.
 */
export function typeChar(previous: RainState, char: string): RainState {
  if (previous.status !== 'playing' || !isTypeable(char)) return { ...previous, events: [] };
  const state = clone(previous);
  const key = foldChar(char);
  const expectedAt = (target: Target) => foldChar(target.answer[target.typed] ?? '');

  let target = state.targets.find(({ key: targetKey }) => targetKey === state.lockedKey);
  if (!target) {
    target = state.targets
      .filter((candidate) => expectedAt(candidate) === key)
      .sort((a, b) => b.y - a.y)[0];
    if (!target) {
      state.combo = 0;
      state.events.push({ type: 'wrong' });
      return state;
    }
    state.lockedKey = target.key;
    state.events.push({ type: 'lock', key: target.key });
  }

  if (expectedAt(target) !== key) {
    state.combo = 0;
    state.events.push({ type: 'wrong' });
    return state;
  }
  target.typed = nextTypeable(target.answer, target.typed + 1);
  state.events.push({ type: 'shot', key: target.key });
  if (target.typed < target.answer.length) return state;

  target.hits -= 1;
  if (target.hits > 0) {
    target.typed = nextTypeable(target.answer, 0);
    state.events.push({ type: 'hit', key: target.key });
    return state;
  }
  destroy(state, target, target.answer);
  finishIfDone(state);
  return state;
}

/** Kiểu Gõ: bỏ khoá mục tiêu hiện tại (phím Backspace hoặc Esc khi đang gõ dở). */
export function releaseLock(previous: RainState): RainState {
  const state = clone(previous);
  const target = state.targets.find(({ key }) => key === state.lockedKey);
  if (target) target.typed = nextTypeable(target.answer, 0);
  state.lockedKey = null;
  return state;
}

/**
 * Kiểu Nói: câu nhận dạng được. Khớp từ của mục tiêu nào đang rơi thì bắn mục tiêu gần đất nhất
 * có từ đó; không khớp mục tiêu nào (tiếng ồn) thì bỏ qua, không trừ combo.
 */
export function speak(previous: RainState, transcript: string): RainState {
  if (previous.status !== 'playing' || !transcript.trim()) return { ...previous, events: [] };
  const state = clone(previous);
  const target = state.targets
    .filter(({ questionId }) => {
      const question = state.questions.find(({ id }) => id === questionId);
      return question ? gradeSpokenText(question.expected, transcript).isCorrect : false;
    })
    .sort((a, b) => b.y - a.y)[0];
  if (!target) return state;
  target.hits -= 1;
  state.events.push({ type: 'shot', key: target.key });
  if (target.hits > 0) {
    state.events.push({ type: 'hit', key: target.key });
    return state;
  }
  destroy(state, target, `${WORD_RAIN_SPOKEN_PREFIX}${transcript.trim()}`);
  finishIfDone(state);
  return state;
}

export function setPaused(previous: RainState, paused: boolean): RainState {
  if (previous.status === 'over' || previous.status === 'won') return previous;
  return { ...previous, status: paused ? 'paused' : 'playing', events: [] };
}
