import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Token trong link "Huỷ nhận mail": `<userId base64url>.<HMAC-SHA256>`. Không lưu database, không
 * hết hạn; đổi `JWT_REFRESH_SECRET` thì mọi link cũ hết hiệu lực.
 */
const PURPOSE = 'unsubscribe-reminders:';

const sign = (userId: string, secret: string) =>
  createHmac('sha256', secret)
    .update(PURPOSE + userId)
    .digest('base64url');

export function createUnsubscribeToken(userId: string, secret: string): string {
  return `${Buffer.from(userId).toString('base64url')}.${sign(userId, secret)}`;
}

/** Trả id người dùng nếu token đúng chữ ký, ngược lại `null`. */
export function readUnsubscribeToken(token: string, secret: string): string | null {
  const [encoded, signature, ...rest] = token.split('.');
  if (!encoded || !signature || rest.length > 0) return null;
  const userId = Buffer.from(encoded, 'base64url').toString('utf8');
  const expected = Buffer.from(sign(userId, secret));
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected) ? userId : null;
}
