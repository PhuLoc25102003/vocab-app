import { apiErrorSchema } from '@vocab/shared';

/**
 * Trình duyệt gọi `NEXT_PUBLIC_API_URL`, có thể là đường dẫn tương đối `/api/v1` được chuyển tiếp.
 * Server của web không gọi được đường dẫn tương đối, nên dùng `API_INTERNAL_URL` nếu có.
 * Biến không có tiền tố `NEXT_PUBLIC_` luôn rỗng ở trình duyệt.
 */
export const BROWSER_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const API_URL = process.env.API_INTERNAL_URL ?? BROWSER_API_URL;

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details?: unknown,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export interface HttpAuth {
  getAccessToken: () => string | null;
  /** Trả token mới, hoặc `null` nếu không làm mới được. */
  refreshAccessToken: () => Promise<string | null>;
}

export interface HttpOptions extends RequestInit {
  /** Không gửi access token và không tự refresh, dùng cho các route của phiên đăng nhập. */
  skipAuth?: boolean;
}

let auth: HttpAuth | null = null;

/** `lib` không được phụ thuộc feature, nên feature auth tự đăng ký vào đây. */
export function configureHttpAuth(next: HttpAuth | null): void {
  auth = next;
}

async function send<T>(path: string, init: RequestInit, token: string | null): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  return readResponse<T>(response);
}

/** Đọc body hoặc ném `HttpError` theo dạng lỗi chung của API. */
export async function readResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    if (parsed.success) {
      const { code, message, details, requestId } = parsed.data.error;
      throw new HttpError(message, response.status, code, details, requestId);
    }
    throw new HttpError(response.statusText, response.status, 'UNKNOWN_ERROR');
  }

  return body as T;
}

export async function http<T = unknown>(
  path: string,
  { skipAuth = false, ...init }: HttpOptions = {},
): Promise<T> {
  const token = skipAuth ? null : (auth?.getAccessToken() ?? null);

  try {
    return await send<T>(path, init, token);
  } catch (error) {
    if (!auth || !token || !(error instanceof HttpError) || error.status !== 401) {
      throw error;
    }
    const freshToken = await auth.refreshAccessToken();
    if (!freshToken) {
      throw error;
    }
    return send<T>(path, init, freshToken);
  }
}
