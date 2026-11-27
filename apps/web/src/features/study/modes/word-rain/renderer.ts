import { isTypeable, type RainEvent, type RainState, type Target } from './engine';

/**
 * Vẽ Mưa từ lên canvas 2D. Màu đọc từ biến CSS của design token nên đúng cả light và dark,
 * không có mã màu cố định. Hiệu ứng (tia laser, hạt nổ, rung) nằm ngoài engine, sinh từ `events`.
 */

export interface Palette {
  bg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  primary: string;
  primarySoft: string;
  danger: string;
  success: string;
  highlight: string;
  highlightFg: string;
}

const TOKENS: Record<keyof Palette, string> = {
  bg: '--bg',
  surface: '--surface',
  border: '--border-strong',
  text: '--text',
  muted: '--text-muted',
  primary: '--primary',
  primarySoft: '--primary-soft',
  danger: '--danger',
  success: '--success',
  highlight: '--highlight',
  highlightFg: '--highlight-fg',
};

export function readPalette(element: Element): Palette {
  const style = getComputedStyle(element);
  return Object.fromEntries(
    Object.entries(TOKENS).map(([key, token]) => [key, style.getPropertyValue(token).trim()]),
  ) as unknown as Palette;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: keyof Palette;
}

interface Laser {
  x: number;
  y: number;
  life: number;
}

interface Ring {
  x: number;
  y: number;
  life: number;
  boss: boolean;
}

interface Star {
  x: number;
  y: number;
  size: number;
  layer: 0 | 1;
}

export interface Fx {
  particles: Particle[];
  lasers: Laser[];
  rings: Ring[];
  stars: Star[];
  shake: number;
  /** Góc mũi máy bay (radian), xoay mượt về mục tiêu đang khoá. */
  aim: number;
  flame: number;
  /** Giảm hạt và tắt rung khi giảm chuyển động hoặc khi tụt khung hình. */
  lite: boolean;
  reducedMotion: boolean;
}

export function createFx(random: () => number, reducedMotion: boolean): Fx {
  return {
    particles: [],
    lasers: [],
    rings: [],
    stars: Array.from({ length: 70 }, (_, index) => ({
      x: random(),
      y: random(),
      size: random() * 1.4 + 0.4,
      layer: (index % 3 === 0 ? 1 : 0) as 0 | 1,
    })),
    shake: 0,
    aim: 0,
    flame: 0,
    lite: reducedMotion,
    reducedMotion,
  };
}

/** Chiều cao dành cho máy bay ở đáy khung, tính theo phần của chiều cao. */
const JET_ZONE = 0.16;
/** Vị trí đường chân trời (mặt đất) mà mục tiêu chạm thì mất khiên. */
export const GROUND = 1 - JET_ZONE;

const toScreen = (target: Pick<Target, 'x' | 'y'>, width: number, height: number) => ({
  x: target.x * width,
  y: 24 + target.y * (GROUND * height - 24),
});

export function applyEvents(
  fx: Fx,
  events: readonly RainEvent[],
  state: RainState,
  previous: RainState,
  size: { width: number; height: number },
  random: () => number,
): void {
  const find = (key: number) =>
    state.targets.find((target) => target.key === key) ??
    previous.targets.find((target) => target.key === key);
  for (const event of events) {
    if (event.type === 'shot' || event.type === 'hit') {
      const target = find(event.key);
      if (target) fx.lasers.push({ ...toScreen(target, size.width, size.height), life: 1 });
    }
    if (event.type === 'destroy') {
      const target = find(event.key);
      if (!target) continue;
      const { x, y } = toScreen(target, size.width, size.height);
      fx.lasers.push({ x, y, life: 1 });
      fx.rings.push({ x, y, life: 1, boss: event.boss });
      const count = fx.lite ? 10 : event.boss ? 46 : 26;
      for (let index = 0; index < count; index += 1) {
        const angle = random() * Math.PI * 2;
        const speed = 60 + random() * (event.boss ? 260 : 180);
        fx.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          max: 0.45 + random() * 0.5,
          size: 1.5 + random() * (event.boss ? 4 : 3),
          color: index % 3 === 0 ? 'highlight' : index % 3 === 1 ? 'primary' : 'danger',
        });
      }
      if (!fx.reducedMotion) fx.shake = event.boss ? 9 : 4;
    }
    if (event.type === 'miss' && !fx.reducedMotion) {
      fx.shake = 7;
    }
  }
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSky(
  ctx: CanvasRenderingContext2D,
  fx: Fx,
  palette: Palette,
  width: number,
  height: number,
  t: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, palette.bg);
  sky.addColorStop(1, palette.surface);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Hai lớp sao trôi với tốc độ khác nhau tạo chiều sâu (thị sai).
  for (const star of fx.stars) {
    const drift = fx.reducedMotion ? 0 : (t / 1000) * (star.layer === 1 ? 0.03 : 0.012);
    const y = ((star.y + drift) % 1) * GROUND * height;
    ctx.globalAlpha = star.layer === 1 ? 0.8 : 0.45;
    ctx.fillStyle = palette.muted;
    ctx.fillRect(star.x * width, y, star.size, star.size);
  }
  ctx.globalAlpha = 1;

  // Thành phố mờ ở chân trời.
  ctx.fillStyle = palette.border;
  ctx.globalAlpha = 0.35;
  const ground = GROUND * height;
  ctx.beginPath();
  ctx.moveTo(0, ground);
  const blocks = 18;
  for (let index = 0; index <= blocks; index += 1) {
    const x = (index / blocks) * width;
    const h = 10 + ((index * 37) % 23) + (index % 4 === 0 ? 14 : 0);
    ctx.lineTo(x, ground - h);
    ctx.lineTo(x + width / blocks, ground - h);
  }
  ctx.lineTo(width, ground);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Đường chân trời: mục tiêu chạm vạch này thì mất khiên.
  ctx.strokeStyle = palette.danger;
  ctx.globalAlpha = 0.5;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(0, ground);
  ctx.lineTo(width, ground);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

/** Chiến đấu cơ cánh tam giác nhìn từ dưới lên, mũi hướng theo góc `aim`. */
function drawJet(
  ctx: CanvasRenderingContext2D,
  fx: Fx,
  palette: Palette,
  width: number,
  height: number,
) {
  const x = width / 2;
  const y = height - JET_ZONE * height * 0.45;
  const s = Math.min(width, height) / 520;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(fx.aim);
  ctx.scale(s, s);

  // Hai luồng lửa động cơ chập chờn.
  const flicker = fx.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(fx.flame);
  for (const side of [-9, 9]) {
    const flame = ctx.createLinearGradient(0, 34, 0, 34 + 34 + flicker * 18);
    flame.addColorStop(0, palette.highlight);
    flame.addColorStop(0.5, palette.danger);
    flame.addColorStop(1, 'transparent');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(side - 5, 34);
    ctx.quadraticCurveTo(side, 34 + 40 + flicker * 18, side + 5, 34);
    ctx.fill();
  }

  // Cánh tam giác và cánh đuôi.
  ctx.fillStyle = palette.border;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(54, 26);
  ctx.lineTo(48, 32);
  ctx.lineTo(10, 22);
  ctx.lineTo(-10, 22);
  ctx.lineTo(-48, 32);
  ctx.lineTo(-54, 26);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-6, 24);
  ctx.lineTo(-24, 40);
  ctx.lineTo(-6, 36);
  ctx.moveTo(6, 24);
  ctx.lineTo(24, 40);
  ctx.lineTo(6, 36);
  ctx.fill();

  // Thân máy bay.
  const hull = ctx.createLinearGradient(-12, 0, 12, 0);
  hull.addColorStop(0, palette.muted);
  hull.addColorStop(0.5, palette.text);
  hull.addColorStop(1, palette.muted);
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.bezierCurveTo(9, -40, 12, -6, 13, 36);
  ctx.lineTo(-13, 36);
  ctx.bezierCurveTo(-12, -6, -9, -40, 0, -58);
  ctx.fill();

  // Viền sáng dọc thân theo màu chủ đạo.
  ctx.strokeStyle = palette.primary;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-30, 26);
  ctx.lineTo(-11, 14);
  ctx.moveTo(30, 26);
  ctx.lineTo(11, 14);
  ctx.stroke();

  // Buồng lái kính phản sáng.
  const glass = ctx.createLinearGradient(-5, -40, 5, -16);
  glass.addColorStop(0, palette.primarySoft);
  glass.addColorStop(0.45, palette.primary);
  glass.addColorStop(1, palette.bg);
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.ellipse(0, -28, 5.5, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.text;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.ellipse(-1.8, -33, 1.4, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  target: Target,
  locked: boolean,
  palette: Palette,
  width: number,
  height: number,
  t: number,
  reducedMotion: boolean,
) {
  const { x, y } = toScreen(target, width, height);
  const scale = target.boss ? 1.35 : 1;
  const bob = reducedMotion ? 0 : Math.sin(t / 260 + target.key) * 1.5;

  // Drone: thân lục giác, hai cánh quạt.
  ctx.save();
  ctx.translate(x, y - 22 * scale + bob);
  ctx.scale(scale, scale);
  ctx.fillStyle = target.boss ? palette.danger : palette.border;
  ctx.beginPath();
  for (let side = 0; side < 6; side += 1) {
    const angle = (Math.PI / 3) * side;
    ctx.lineTo(Math.cos(angle) * 10, Math.sin(angle) * 7);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = palette.muted;
  ctx.lineWidth = 2;
  const spin = reducedMotion ? 0 : t / 40;
  for (const side of [-16, 16]) {
    ctx.beginPath();
    ctx.ellipse(side, -4, 7, 1.6, spin, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = locked ? palette.highlight : palette.primary;
  ctx.beginPath();
  ctx.arc(0, 1, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Thẻ nghĩa và các ô chữ đã gõ.
  const fontSize = Math.max(13, Math.min(16, width / 34)) * (target.boss ? 1.1 : 1);
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  const prompt = target.prompt.length > 28 ? `${target.prompt.slice(0, 27)}…` : target.prompt;
  const slots = target.answer
    .split('')
    .map((char, index) => (index < target.typed || !isTypeable(char) ? char : '_'))
    .join(' ');
  const promptWidth = ctx.measureText(prompt).width;
  ctx.font = `500 ${fontSize - 2}px ui-monospace, monospace`;
  const slotWidth = ctx.measureText(slots).width;
  const w = Math.max(promptWidth, slotWidth) + 20;
  const h = fontSize * 2 + 16;
  const left = Math.min(Math.max(x - w / 2, 4), width - w - 4);
  const top = y - 6 + bob;

  roundedRect(ctx, left, top, w, h, 10);
  ctx.fillStyle = palette.surface;
  ctx.globalAlpha = 0.92;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = locked ? 2.5 : 1;
  ctx.strokeStyle = locked ? palette.highlight : target.boss ? palette.danger : palette.border;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = palette.text;
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  ctx.fillText(prompt, left + w / 2, top + 6);
  ctx.font = `500 ${fontSize - 2}px ui-monospace, monospace`;
  ctx.fillStyle = locked ? palette.primary : palette.muted;
  ctx.fillText(slots, left + w / 2, top + 8 + fontSize);
  if (target.boss && target.hits > 1) {
    ctx.fillStyle = palette.danger;
    ctx.fillText('×2', left + w - 12, top - fontSize);
  }
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  state: RainState,
  fx: Fx,
  palette: Palette,
  size: { width: number; height: number },
  t: number,
  dt: number,
): void {
  const { width, height } = size;
  ctx.save();
  if (fx.shake > 0) {
    ctx.translate((Math.random() - 0.5) * fx.shake, (Math.random() - 0.5) * fx.shake);
    fx.shake = Math.max(0, fx.shake - dt * 30);
  }
  drawSky(ctx, fx, palette, width, height, t);

  const locked = state.targets.find(({ key }) => key === state.lockedKey);
  const goal = locked
    ? Math.atan2(
        toScreen(locked, width, height).x - width / 2,
        height - toScreen(locked, width, height).y,
      )
    : 0;
  fx.aim += (Math.max(-0.9, Math.min(0.9, goal)) - fx.aim) * Math.min(1, dt * 10);
  fx.flame += dt * 28;

  for (const target of state.targets) {
    drawTarget(
      ctx,
      target,
      target.key === state.lockedKey,
      palette,
      width,
      height,
      t,
      fx.reducedMotion,
    );
  }

  // Tia laser từ mũi máy bay tới mục tiêu.
  const nose = { x: width / 2, y: height - JET_ZONE * height * 0.45 - 30 };
  for (const laser of fx.lasers) {
    ctx.globalAlpha = laser.life;
    ctx.strokeStyle = palette.highlight;
    ctx.lineWidth = 3 * laser.life;
    ctx.beginPath();
    ctx.moveTo(nose.x, nose.y);
    ctx.lineTo(laser.x, laser.y);
    ctx.stroke();
    laser.life -= dt * 7;
  }
  fx.lasers = fx.lasers.filter(({ life }) => life > 0);

  for (const ring of fx.rings) {
    ctx.globalAlpha = ring.life;
    ctx.strokeStyle = ring.boss ? palette.danger : palette.highlight;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, (1 - ring.life) * (ring.boss ? 90 : 55) + 6, 0, Math.PI * 2);
    ctx.stroke();
    ring.life -= dt * 2.6;
  }
  fx.rings = fx.rings.filter(({ life }) => life > 0);

  for (const particle of fx.particles) {
    particle.life += dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 140 * dt;
    ctx.globalAlpha = Math.max(0, 1 - particle.life / particle.max);
    ctx.fillStyle = palette[particle.color];
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  fx.particles = fx.particles.filter(({ life, max }) => life < max);
  ctx.globalAlpha = 1;

  drawJet(ctx, fx, palette, width, height);
  ctx.restore();
}
