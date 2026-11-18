import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().min(1).default('15m'),
  JWT_REFRESH_TTL: z.string().min(1).default('30d'),
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
