import { Logger } from '@nestjs/common';
import webpush from 'web-push';

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** `gone`: dịch vụ đẩy báo đăng ký không còn (404, 410), cần xoá. */
export type PushResult = 'sent' | 'gone' | 'failed';

/** Thông báo sống tối đa 12 giờ trên dịch vụ đẩy nếu máy đang tắt. */
const TTL_SECONDS = 12 * 60 * 60;

export abstract class PushSender {
  abstract readonly enabled: boolean;
  abstract readonly publicKey: string;
  abstract send(target: PushTarget, payload: string): Promise<PushResult>;
}

export class WebPushSender extends PushSender {
  readonly enabled = true;
  private readonly logger = new Logger(WebPushSender.name);

  constructor(
    readonly publicKey: string,
    privateKey: string,
    subject: string,
  ) {
    super();
    webpush.setVapidDetails(subject, publicKey, privateKey);
  }

  async send({ endpoint, p256dh, auth }: PushTarget, payload: string): Promise<PushResult> {
    try {
      await webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, payload, {
        TTL: TTL_SECONDS,
        urgency: 'normal',
      });
      return 'sent';
    } catch (error) {
      const status = (error as { statusCode?: unknown } | null)?.statusCode;
      if (status === 404 || status === 410) {
        return 'gone';
      }
      this.logger.warn(`Không gửi được thông báo đẩy (status ${String(status)})`);
      return 'failed';
    }
  }
}

/** Dùng khi thiếu khoá VAPID và trong test: không gửi gì, giữ lại để kiểm tra. */
export class InMemoryPushSender extends PushSender {
  readonly sent: { target: PushTarget; payload: string }[] = [];
  /** Endpoint giả lập đã hết hạn. */
  readonly goneEndpoints = new Set<string>();

  constructor(
    readonly enabled = false,
    readonly publicKey = '',
  ) {
    super();
  }

  send(target: PushTarget, payload: string): Promise<PushResult> {
    if (this.goneEndpoints.has(target.endpoint)) {
      return Promise.resolve('gone');
    }
    this.sent.push({ target, payload });
    return Promise.resolve('sent');
  }
}
