import { z } from 'zod';

const DURATION_UNIT_SECONDS = { s: 1, m: 60, h: 3_600, d: 86_400 } as const;
const durationSchema = z.string().regex(/^[1-9]\d*[smhd]$/, 'Dùng dạng 15m, 12h hoặc 30d');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: durationSchema.default('15m'),
  JWT_REFRESH_TTL: durationSchema.default('30d'),
  CORS_ORIGINS: z.string().min(1).default('http://localhost:3000'),
  /** IP hoặc CIDR của proxy đứng trước API. Thiếu thì rate limit gộp mọi người vào IP của proxy. */
  TRUSTED_PROXIES: z.string().default(''),
});

export type Env = z.infer<typeof envSchema>;

/** Chạy khi khởi động: thiếu hoặc sai biến môi trường thì app dừng ngay. */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Biến môi trường không hợp lệ:\n${problems}`);
  }
  return result.data;
}

/** Đổi giá trị đã qua `durationSchema` thành số giây. */
export function durationToSeconds(value: string): number {
  const unit = value.slice(-1) as keyof typeof DURATION_UNIT_SECONDS;
  return Number(value.slice(0, -1)) * DURATION_UNIT_SECONDS[unit];
}

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseCorsOrigins(value: string): string[] {
  return parseList(value);
}

/** Không có proxy thì trả `false`, để Fastify bỏ qua header `X-Forwarded-For`. */
export function parseTrustedProxies(value: string): string[] | false {
  const proxies = parseList(value);
  return proxies.length > 0 ? proxies : false;
}
