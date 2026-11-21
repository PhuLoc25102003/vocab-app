/**
 * Thông báo validate dạng khoá dịch (việc 6.2b, ADR 0003): `v:<khoá>` hoặc `v:<khoá>|<JSON tham số>`.
 * API trả nguyên chuỗi này trong `details`, web dịch theo namespace `validation`.
 */
export const VALIDATION_PREFIX = 'v:';

export type ValidationParams = Record<string, string | number>;

export function vm(key: string, params?: ValidationParams): string {
  return params
    ? `${VALIDATION_PREFIX}${key}|${JSON.stringify(params)}`
    : `${VALIDATION_PREFIX}${key}`;
}

/** Tách khoá và tham số; chuỗi không theo dạng trên trả `null` để nơi dùng giữ nguyên. */
export function parseValidationMessage(
  message: string,
): { key: string; params: ValidationParams } | null {
  if (!message.startsWith(VALIDATION_PREFIX)) return null;
  const body = message.slice(VALIDATION_PREFIX.length);
  const split = body.indexOf('|');
  if (split === -1) return { key: body, params: {} };
  try {
    const params: unknown = JSON.parse(body.slice(split + 1));
    if (params === null || typeof params !== 'object' || Array.isArray(params)) return null;
    return { key: body.slice(0, split), params: params as ValidationParams };
  } catch {
    return null;
  }
}
