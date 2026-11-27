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
  /**
   * IP hoặc CIDR của proxy đứng trước API, hoặc số tầng proxy khi IP của proxy thay đổi liên tục.
   * Thiếu thì rate limit gộp mọi người vào IP của proxy.
   */
  TRUSTED_PROXIES: z.string().default(''),
  REFRESH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  REFRESH_COOKIE_DOMAIN: z.string().optional(),
  /** Để trống thì tắt đăng nhập Google. */
  GOOGLE_CLIENT_ID: z.string().trim().default(''),
  /** Số request mỗi phút cho một người dùng và cho một IP chưa đăng nhập. */
  RATE_LIMIT_USER_PER_MINUTE: z.coerce.number().int().min(1).default(100),
  RATE_LIMIT_GUEST_PER_MINUTE: z.coerce.number().int().min(1).default(300),
  /** Số lần đăng ký mỗi phút cho một IP. */
  RATE_LIMIT_REGISTER_PER_MINUTE: z.coerce.number().int().min(1).default(3),
  /** Số lần gọi `/auth/refresh` mỗi phút cho một IP. */
  RATE_LIMIT_REFRESH_PER_MINUTE: z.coerce.number().int().min(1).default(60),
  /** Để trống thì không gửi thư thật, thư được ghi log và giữ trong bộ nhớ (docs/08-deploy.md). */
  BREVO_API_KEY: z.string().trim().default(''),
  /** Địa chỉ gửi đã xác minh trong Brevo. */
  EMAIL_FROM: z.string().trim().default(''),
  /** Địa chỉ web để tạo liên kết trong thư. Để trống thì lấy origin đầu tiên của CORS_ORIGINS. */
  WEB_ORIGIN: z.string().trim().default(''),
  /**
   * Khoá bí mật cho `POST /internal/jobs/*` (GitHub Actions gọi theo lịch). Để trống thì tắt các
   * endpoint job. Tạo bằng `openssl rand -hex 32`.
   */
  JOBS_SECRET: z
    .string()
    .trim()
    .refine((value) => value === '' || value.length >= 32, 'JOBS_SECRET cần ít nhất 32 ký tự')
    .default(''),
  /**
   * Khoá VAPID cho Web Push, tạo bằng `npx web-push generate-vapid-keys`. Thiếu một biến thì tắt
   * thông báo đẩy, nhắc học vẫn có trong chuông. `VAPID_SUBJECT` là `mailto:` hoặc địa chỉ web.
   */
  VAPID_PUBLIC_KEY: z.string().trim().default(''),
  VAPID_PRIVATE_KEY: z.string().trim().default(''),
  VAPID_SUBJECT: z.string().trim().default(''),
  /** Upstash Redis REST, dùng chung bộ đếm rate limit giữa các instance. Để trống thì đếm trong bộ nhớ. */
  UPSTASH_REDIS_REST_URL: z
    .string()
    .trim()
    .pipe(z.union([z.literal(''), z.url()]))
    .default(''),
  UPSTASH_REDIS_REST_TOKEN: z.string().trim().default(''),
  /** Cloudflare R2 cho ảnh của thẻ. Thiếu một biến thì tắt tải ảnh (docs/08-deploy.md). */
  R2_ACCOUNT_ID: z.string().trim().default(''),
  R2_ACCESS_KEY_ID: z.string().trim().default(''),
  R2_SECRET_ACCESS_KEY: z.string().trim().default(''),
  R2_BUCKET: z.string().trim().default(''),
  /** Địa chỉ công khai của bucket, ví dụ https://pub-xxx.r2.dev. */
  R2_PUBLIC_URL: z
    .string()
    .trim()
    .pipe(z.union([z.literal(''), z.url()]))
    .default(''),
  /** Khoá API Unsplash để tìm ảnh trực tuyến cho thẻ. */
  UNSPLASH_ACCESS_KEY: z.string().trim().default(''),
  /** Khoá API Pixabay để tìm ảnh trực tuyến cho thẻ. */
  PIXABAY_API_KEY: z.string().trim().default(''),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
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

/** Địa chỉ web cho liên kết và chuyển hướng: `WEB_ORIGIN`, thiếu thì lấy origin đầu của CORS. */
export function resolveWebOrigin(webOrigin: string, corsOrigins: string): string {
  const [first] = parseCorsOrigins(corsOrigins);
  return (webOrigin || first || '').replace(/\/$/, '');
}

/**
 * Không có proxy thì trả `false`, để Fastify bỏ qua header `X-Forwarded-For`.
 * Một số nguyên dương là số tầng proxy, ví dụ `2` cho Vercel rồi Render.
 */
export type TrustProxy = string[] | ((address: string, hop: number) => boolean) | false;

export function parseTrustedProxies(value: string): TrustProxy {
  if (/^\s*[1-9]\d*\s*$/.test(value)) {
    // Giống cách proxy-addr hiểu một con số: tin các tầng gần API nhất.
    const hops = Number(value);
    return (_address, hop) => hop < hops;
  }
  const proxies = parseList(value);
  return proxies.length > 0 ? proxies : false;
}
