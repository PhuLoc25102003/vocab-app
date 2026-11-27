import { Injectable } from '@nestjs/common';
import {
  notificationPrefsSchema,
  type PushPayload,
  type PushSubscriptionInput,
} from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { PushSender } from '../../infrastructure/push/push-sender';
import { PushRepository } from './push.repository';

/** Gửi song song tối đa bấy nhiêu thông báo một lúc. */
const SEND_CONCURRENCY = 20;

/** Người dùng có cho phép đẩy loại thông báo này không. Thông báo gửi thử luôn được gửi. */
function allowed(type: PushPayload['type'], rawPrefs: unknown): boolean {
  if (type === 'TEST') return true;
  const prefs = notificationPrefsSchema
    .catch(notificationPrefsSchema.parse({}))
    .parse(rawPrefs ?? {});
  return type === 'REVIEW_DUE' ? prefs.reviewPush : prefs.assignmentPush;
}

@Injectable()
export class PushService {
  constructor(
    private readonly push: PushRepository,
    private readonly sender: PushSender,
  ) {}

  config() {
    return ok({ enabled: this.sender.enabled, publicKey: this.sender.publicKey });
  }

  async subscribe(userId: string, dto: PushSubscriptionInput): Promise<void> {
    await this.push.upsert(userId, dto);
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.push.deleteForUser(userId, endpoint);
  }

  /** Gửi thử tới mọi thiết bị của tôi. Trả số thiết bị đã nhận. */
  async sendTest(userId: string) {
    const sent = await this.sendEach(
      new Map([[userId, { type: 'TEST' as const, data: {}, href: '/account' }]]),
    );
    return ok({ sent });
  }

  /** Gửi mỗi người một nội dung tới mọi thiết bị của họ; xoá đăng ký đã hết hạn. */
  async sendEach(payloads: ReadonlyMap<string, PushPayload>): Promise<number> {
    if (!this.sender.enabled || payloads.size === 0) return 0;
    const targets = (await this.push.findForUsers([...payloads.keys()])).filter((target) => {
      const payload = payloads.get(target.userId);
      return payload !== undefined && allowed(payload.type, target.user.notificationPrefs);
    });
    const gone: string[] = [];
    let sent = 0;
    for (let start = 0; start < targets.length; start += SEND_CONCURRENCY) {
      const batch = targets.slice(start, start + SEND_CONCURRENCY);
      const results = await Promise.all(
        batch.map((target) =>
          this.sender.send(target, JSON.stringify(payloads.get(target.userId))),
        ),
      );
      results.forEach((result, index) => {
        if (result === 'gone') gone.push(batch[index]!.endpoint);
        if (result === 'sent') sent += 1;
      });
    }
    await this.push.deleteEndpoints(gone);
    return sent;
  }
}
