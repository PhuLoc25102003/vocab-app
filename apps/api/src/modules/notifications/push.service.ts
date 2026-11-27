import { Injectable } from '@nestjs/common';
import type { PushPayload, PushSubscriptionInput } from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { PushSender } from '../../infrastructure/push/push-sender';
import { PushRepository } from './push.repository';

/** Gửi song song tối đa bấy nhiêu thông báo một lúc. */
const SEND_CONCURRENCY = 20;

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

  /** Gửi mỗi người một nội dung tới mọi thiết bị của họ; xoá đăng ký đã hết hạn. */
  async sendEach(payloads: ReadonlyMap<string, PushPayload>): Promise<number> {
    if (!this.sender.enabled || payloads.size === 0) return 0;
    const targets = await this.push.findForUsers([...payloads.keys()]);
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
