import { isTypeable, type RainEvent, type RainState, type Target } from './engine';

/**
 * Vẽ Mưa từ lên canvas 2D. Màu đọc từ biến CSS của design token (nhóm `--game-*` cho bầu trời đêm,
 * cùng các token chung) nên không có mã màu cố định. Hiệu ứng (tia laser, hạt nổ, rung) nằm ngoài
 * engine, sinh từ `events`.
 */

export interface Palette {
  sky: string;
  skyBottom: string;
  ink: string;
  inkMuted: string;
  panel: string;
  steel: string;
  glow: string;
  danger: string;
  highlight: string;
  /** Chữ nghĩa dùng font giao diện, chữ đáp án dùng font thẻ như các chế độ học khác. */
  fontSans: string;
  fontCard: string;
}

type ColorKey = Exclude<keyof Palette, 'fontSans' | 'fontCard'>;

const TOKENS: Record<ColorKey, string> = {
  sky: '--game-sky-top',
  skyBottom: '--game-sky-bottom',
  ink: '--game-ink',
  inkMuted: '--game-ink-muted',
  panel: '--game-panel',
  steel: '--game-steel',
  glow: '--game-glow',
  danger: '--danger',
  highlight: '--highlight',
};

export function readPalette(element: Element): Palette {
  const style = getComputedStyle(element);
  const read = (token: string) => style.getPropertyValue(token).trim();
  const colors = Object.fromEntries(
    Object.entries(TOKENS).map(([key, token]) => [key, read(token)]),
  ) as Record<ColorKey, string>;
  const sans = read('--font-be-vietnam-pro');
  const card = read('--font-literata');
  return {
    ...colors,
    fontSans: sans ? `${sans}, system-ui, sans-serif` : 'system-ui, sans-serif',
    fontCard: card ? `${card}, Georgia, serif` : 'Georgia, serif',
  };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: ColorKey;
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
  phase: number;
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
  /** Giảm hạt, tắt quầng sáng và rung khi giảm chuyển động hoặc khi tụt khung hình. */
  lite: boolean;
  reducedMotion: boolean;
}

export function createFx(random: () => number, reducedMotion: boolean): Fx {
  return {
    particles: [],
    lasers: [],
    rings: [],
    stars: Array.from({ length: 90 }, (_, index) => ({
      x: random(),
      y: random(),
      size: random() * 1.6 + 0.5,
      layer: (index % 3 === 0 ? 1 : 0) as 0 | 1,
      phase: random() * Math.PI * 2,
    })),
    shake: 0,
    aim: 0,
    flame: 0,
    lite: reducedMotion,
    reducedMotion,
  };
}

/** Chiều cao dành cho máy bay ở đáy khung, tính theo phần của chiều cao. */
const JET_ZONE = 0.2;
/** Vị trí đường chân trời (mặt đất) mà mục tiêu chạm thì mất khiên. */
export const GROUND = 1 - JET_ZONE;
/** Chừa phía trên cho thanh HUD phủ lên khung chơi. */
const TOP_INSET = 56;

const toScreen = (target: Pick<Target, 'x' | 'y'>, width: number, height: number) => ({
  x: target.x * width,
  y: TOP_INSET + target.y * (GROUND * height - TOP_INSET),
});

const jetCenter = (width: number, height: number) => ({
  x: width / 2,
  y: height - JET_ZONE * height * 0.42,
});

const jetScale = (width: number, height: number) =>
  Math.max(0.62, Math.min(1, Math.min(width, height) / 560));

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
      const count = fx.lite ? 12 : event.boss ? 54 : 32;
      for (let index = 0; index < count; index += 1) {
        const angle = random() * Math.PI * 2;
        const speed = 60 + random() * (event.boss ? 280 : 200);
        fx.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          max: 0.45 + random() * 0.55,
          size: 1.5 + random() * (event.boss ? 4 : 3),
          color: index % 3 === 0 ? 'highlight' : index % 3 === 1 ? 'glow' : 'danger',
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

/** Quầng sáng mờ; tắt ở chế độ nhẹ vì `shadowBlur` tốn GPU trên điện thoại yếu. */
function glow(ctx: CanvasRenderingContext2D, fx: Fx, color: string, blur: number) {
  ctx.shadowColor = color;
  ctx.shadowBlur = fx.lite ? 0 : blur;
}

function noGlow(ctx: CanvasRenderingContext2D) {
  ctx.shadowBlur = 0;
}

function drawSky(
  ctx: CanvasRenderingContext2D,
  fx: Fx,
  palette: Palette,
  width: number,
  height: number,
  t: number,
) {
  const ground = GROUND * height;
  const sky = ctx.createLinearGradient(0, 0, 0, ground);
  sky.addColorStop(0, palette.sky);
  sky.addColorStop(1, palette.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Tinh vân mờ cho bầu trời có chiều sâu.
  const nebula = ctx.createRadialGradient(
    width * 0.78,
    height * 0.22,
    0,
    width * 0.78,
    height * 0.22,
    width * 0.55,
  );
  nebula.addColorStop(0, palette.glow);
  nebula.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, width, ground);
  ctx.globalAlpha = 1;

  // Hai lớp sao trôi với tốc độ khác nhau (thị sai) và nhấp nháy nhẹ.
  ctx.fillStyle = palette.ink;
  for (const star of fx.stars) {
    const drift = fx.reducedMotion ? 0 : (t / 1000) * (star.layer === 1 ? 0.03 : 0.012);
    const y = ((star.y + drift) % 1) * ground;
    const twinkle = fx.reducedMotion ? 1 : 0.65 + 0.35 * Math.sin(t / 650 + star.phase);
    ctx.globalAlpha = (star.layer === 1 ? 0.85 : 0.4) * twinkle;
    ctx.fillRect(star.x * width, y, star.size, star.size);
  }
  ctx.globalAlpha = 1;

  // Thành phố về đêm ở chân trời, cửa sổ sáng đèn.
  const blocks = Math.max(10, Math.round(width / 38));
  const blockWidth = width / blocks;
  ctx.fillStyle = palette.sky;
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.moveTo(0, ground);
  const heights: number[] = [];
  for (let index = 0; index <= blocks; index += 1) {
    const h = 14 + ((index * 37) % 29) + (index % 5 === 0 ? 22 : 0);
    heights.push(h);
    ctx.lineTo(index * blockWidth, ground - h);
    ctx.lineTo((index + 1) * blockWidth, ground - h);
  }
  ctx.lineTo(width, ground);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = palette.highlight;
  heights.forEach((h, index) => {
    for (let row = 6; row < h - 4; row += 7) {
      for (let col = 4; col < blockWidth - 4; col += 7) {
        if ((index * 7 + row * 3 + col) % 5 === 0) {
          ctx.fillRect(index * blockWidth + col, ground - h + row, 2, 2);
        }
      }
    }
  });
  ctx.globalAlpha = 1;

  // Mặt đất: lưới phối cảnh hội tụ về giữa, vạch ngang trôi về phía người chơi.
  ctx.fillStyle = palette.sky;
  ctx.fillRect(0, ground, width, height - ground);
  ctx.strokeStyle = palette.glow;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.22;
  const depth = height - ground;
  const scroll = fx.reducedMotion ? 0 : (t / 1600) % 1;
  for (let line = 0; line < 6; line += 1) {
    const p = (line + scroll) / 6;
    const y = ground + depth * p * p;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let column = -6; column <= 6; column += 1) {
    ctx.beginPath();
    ctx.moveTo(width / 2 + column * (width / 14), ground);
    ctx.lineTo(width / 2 + column * (width / 4), height);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Vạch phòng thủ: mục tiêu chạm vạch này thì mất khiên.
  ctx.strokeStyle = palette.danger;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.8;
  glow(ctx, fx, palette.danger, 10);
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(0, ground);
  ctx.lineTo(width, ground);
  ctx.stroke();
  ctx.setLineDash([]);
  noGlow(ctx);
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
  const { x, y } = jetCenter(width, height);
  const s = jetScale(width, height);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(fx.aim);
  ctx.scale(s, s);

  // Hai luồng lửa động cơ: lõi vàng, viền xanh, chập chờn.
  const flicker = fx.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(fx.flame);
  glow(ctx, fx, palette.glow, 16);
  for (const side of [-8, 8]) {
    const length = 30 + flicker * 16;
    const flame = ctx.createLinearGradient(0, 34, 0, 34 + length);
    flame.addColorStop(0, palette.highlight);
    flame.addColorStop(0.35, palette.glow);
    flame.addColorStop(1, 'transparent');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(side - 5, 34);
    ctx.quadraticCurveTo(side, 34 + length * 1.3, side + 5, 34);
    ctx.fill();
  }
  noGlow(ctx);

  // Cánh tam giác, đổ bóng kim loại từ giữa ra mép.
  const wing = ctx.createLinearGradient(-56, 0, 56, 0);
  wing.addColorStop(0, palette.steel);
  wing.addColorStop(0.5, palette.inkMuted);
  wing.addColorStop(1, palette.steel);
  ctx.fillStyle = wing;
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(56, 24);
  ctx.lineTo(50, 32);
  ctx.lineTo(10, 22);
  ctx.lineTo(-10, 22);
  ctx.lineTo(-50, 32);
  ctx.lineTo(-56, 24);
  ctx.closePath();
  ctx.fill();
  // Cánh đuôi.
  ctx.fillStyle = palette.steel;
  ctx.beginPath();
  ctx.moveTo(-6, 22);
  ctx.lineTo(-26, 40);
  ctx.lineTo(-6, 36);
  ctx.closePath();
  ctx.moveTo(6, 22);
  ctx.lineTo(26, 40);
  ctx.lineTo(6, 36);
  ctx.closePath();
  ctx.fill();

  // Đèn hai đầu cánh.
  ctx.fillStyle = palette.danger;
  ctx.fillRect(-55, 23, 3, 3);
  ctx.fillStyle = palette.glow;
  ctx.fillRect(52, 23, 3, 3);

  // Thân máy bay.
  const hull = ctx.createLinearGradient(-13, 0, 13, 0);
  hull.addColorStop(0, palette.steel);
  hull.addColorStop(0.5, palette.ink);
  hull.addColorStop(1, palette.steel);
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(0, -60);
  ctx.bezierCurveTo(9, -42, 12, -6, 13, 36);
  ctx.lineTo(-13, 36);
  ctx.bezierCurveTo(-12, -6, -9, -42, 0, -60);
  ctx.fill();

  // Sọc phát sáng dọc mép cánh.
  ctx.strokeStyle = palette.glow;
  ctx.lineWidth = 1.6;
  glow(ctx, fx, palette.glow, 8);
  ctx.beginPath();
  ctx.moveTo(-40, 24);
  ctx.lineTo(-12, 8);
  ctx.moveTo(40, 24);
  ctx.lineTo(12, 8);
  ctx.stroke();
  noGlow(ctx);

  // Buồng lái kính phản sáng.
  const glass = ctx.createLinearGradient(-5, -42, 5, -16);
  glass.addColorStop(0, palette.ink);
  glass.addColorStop(0.4, palette.glow);
  glass.addColorStop(1, palette.sky);
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.ellipse(0, -30, 5.5, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.ink;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.ellipse(-1.8, -35, 1.3, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** Góc ngắm bốn cạnh quanh thẻ đang khoá. */
function drawReticle(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  w: number,
  h: number,
  color: string,
) {
  const pad = 5;
  const arm = 10;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (const [cx, cy, dx, dy] of [
    [left - pad, top - pad, 1, 1],
    [left + w + pad, top - pad, -1, 1],
    [left - pad, top + h + pad, 1, -1],
    [left + w + pad, top + h + pad, -1, -1],
  ] as const) {
    ctx.moveTo(cx + dx * arm, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * arm);
  }
  ctx.stroke();
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  fx: Fx,
  target: Target,
  locked: boolean,
  palette: Palette,
  width: number,
  height: number,
  t: number,
) {
  const { x, y } = toScreen(target, width, height);
  const scale = (target.boss ? 1.6 : 1.2) * Math.max(0.85, Math.min(1, width / 560));
  const bob = fx.reducedMotion ? 0 : Math.sin(t / 260 + target.key) * 1.5;
  const accent = target.boss ? palette.danger : locked ? palette.highlight : palette.glow;

  // Drone: thân lục giác kim loại, mắt phát sáng, hai cánh quạt quay.
  ctx.save();
  ctx.translate(x, y - 20 * scale + bob);
  ctx.scale(scale, scale);
  ctx.strokeStyle = palette.inkMuted;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-10, -2);
  ctx.lineTo(-17, -5);
  ctx.moveTo(10, -2);
  ctx.lineTo(17, -5);
  ctx.stroke();
  const spin = fx.reducedMotion ? 0.4 : t / 40;
  ctx.globalAlpha = 0.75;
  for (const side of [-17, 17]) {
    ctx.beginPath();
    ctx.ellipse(side, -6, 8, 1.8, spin, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const body = ctx.createLinearGradient(0, -7, 0, 7);
  body.addColorStop(0, palette.inkMuted);
  body.addColorStop(1, palette.steel);
  ctx.fillStyle = body;
  ctx.beginPath();
  for (let side = 0; side < 6; side += 1) {
    const angle = (Math.PI / 3) * side;
    ctx.lineTo(Math.cos(angle) * 11, Math.sin(angle) * 7.5);
  }
  ctx.closePath();
  ctx.fill();
  glow(ctx, fx, accent, 10);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(0, 1, 3, 0, Math.PI * 2);
  ctx.fill();
  noGlow(ctx);
  ctx.restore();

  // Thẻ nghĩa: kính tối, chữ sáng; dưới là các ô chữ của đáp án.
  const fontSize = Math.max(14, Math.min(17, width / 32)) * (target.boss ? 1.08 : 1);
  const cell = fontSize * 0.72;
  const gap = 2;
  const chars = [...target.answer];
  const cellWidth = (char: string) => (char === ' ' ? cell * 0.55 : cell);
  const slotsWidth = chars.reduce((sum, char) => sum + cellWidth(char) + gap, -gap);

  ctx.font = `600 ${fontSize}px ${palette.fontSans}`;
  const maxPrompt = Math.max(slotsWidth, width * 0.6);
  let prompt = target.prompt;
  while (prompt.length > 4 && ctx.measureText(prompt).width > maxPrompt) {
    prompt = `${prompt.slice(0, -2)}…`;
  }
  const promptWidth = ctx.measureText(prompt).width;
  const w = Math.min(width - 8, Math.max(promptWidth, slotsWidth) + 28);
  const h = fontSize * 2 + 22;
  const left = Math.min(Math.max(x - w / 2, 4), width - w - 4);
  const top = y - 4 + bob;

  roundedRect(ctx, left, top, w, h, 12);
  ctx.fillStyle = palette.panel;
  glow(ctx, fx, accent, locked ? 18 : 6);
  ctx.fill();
  noGlow(ctx);
  ctx.lineWidth = locked ? 2 : 1;
  ctx.strokeStyle = accent;
  ctx.globalAlpha = locked || target.boss ? 1 : 0.45;
  ctx.stroke();
  ctx.globalAlpha = 1;
  if (locked) drawReticle(ctx, left, top, w, h, palette.highlight);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = palette.ink;
  ctx.fillText(prompt, left + w / 2, top + 8);

  // Ô chữ: chữ đã gõ màu vàng, chữ cần gõ là gạch dưới, dấu câu tự điền hiện mờ.
  ctx.font = `600 ${fontSize - 1}px ${palette.fontCard}`;
  const baseline = top + 14 + fontSize;
  let cursor = left + (w - slotsWidth) / 2;
  chars.forEach((char, index) => {
    const cw = cellWidth(char);
    const center = cursor + cw / 2;
    if (index < target.typed && isTypeable(char)) {
      ctx.fillStyle = palette.highlight;
      ctx.fillText(char, center, baseline);
    } else if (!isTypeable(char)) {
      if (char !== ' ') {
        ctx.fillStyle = palette.inkMuted;
        ctx.fillText(char, center, baseline);
      }
    } else {
      ctx.fillStyle = index === target.typed && locked ? palette.highlight : palette.inkMuted;
      ctx.globalAlpha = index === target.typed && locked ? 1 : 0.7;
      ctx.fillRect(cursor + 1, baseline + fontSize - 2, cw - 2, 2);
      ctx.globalAlpha = 1;
    }
    cursor += cw + gap;
  });

  if (target.boss && target.hits > 1) {
    const label = '×2';
    ctx.font = `700 ${fontSize - 3}px ${palette.fontSans}`;
    const bw = ctx.measureText(label).width + 12;
    roundedRect(ctx, left + w - bw / 2 - 6, top - 9, bw, fontSize + 2, 8);
    ctx.fillStyle = palette.danger;
    ctx.fill();
    ctx.fillStyle = palette.ink;
    ctx.fillText(label, left + w - 6, top - 8);
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

  const jet = jetCenter(width, height);
  const locked = state.targets.find(({ key }) => key === state.lockedKey);
  const goal = locked
    ? Math.atan2(
        toScreen(locked, width, height).x - jet.x,
        jet.y - toScreen(locked, width, height).y,
      )
    : 0;
  fx.aim += (Math.max(-0.9, Math.min(0.9, goal)) - fx.aim) * Math.min(1, dt * 10);
  fx.flame += dt * 28;

  // Mục tiêu đang khoá vẽ sau cùng để nằm trên các thẻ khác.
  const ordered = [...state.targets].sort(
    (a, b) => Number(a.key === state.lockedKey) - Number(b.key === state.lockedKey),
  );
  for (const target of ordered) {
    drawTarget(ctx, fx, target, target.key === state.lockedKey, palette, width, height, t);
  }

  // Tia laser từ mũi máy bay tới mục tiêu: lõi vàng, quầng xanh.
  const reach = 60 * jetScale(width, height);
  const nose = {
    x: jet.x + Math.sin(fx.aim) * reach,
    y: jet.y - Math.cos(fx.aim) * reach,
  };
  for (const laser of fx.lasers) {
    ctx.globalAlpha = laser.life;
    glow(ctx, fx, palette.glow, 12);
    ctx.strokeStyle = palette.glow;
    ctx.lineWidth = 5 * laser.life;
    ctx.beginPath();
    ctx.moveTo(nose.x, nose.y);
    ctx.lineTo(laser.x, laser.y);
    ctx.stroke();
    noGlow(ctx);
    ctx.strokeStyle = palette.highlight;
    ctx.lineWidth = 1.6 * laser.life;
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
