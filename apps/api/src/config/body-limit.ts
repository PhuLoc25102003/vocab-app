import type { FastifyAdapter } from '@nestjs/platform-fastify';

/** Đủ cho 2.000 thẻ có nội dung dài hoặc nội dung nhập 2 MB. Route khác giữ giới hạn mặc định 1 MB của Fastify. */
export const CARD_BODY_LIMIT_BYTES = 5 * 1024 * 1024;

const CARD_ROUTES = new Set([
  'POST /api/v1/sets',
  'PUT /api/v1/sets/:id/cards',
  'POST /api/v1/import/preview',
]);

/** Phải gọi trước khi Nest đăng ký route. */
export function applyBodyLimits(adapter: FastifyAdapter): void {
  adapter.getInstance().addHook('onRoute', (route) => {
    const methods = [route.method].flat();
    if (methods.some((method) => CARD_ROUTES.has(`${method} ${route.url}`))) {
      route.bodyLimit = CARD_BODY_LIMIT_BYTES;
    }
  });
}
