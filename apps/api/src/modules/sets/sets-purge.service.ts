import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import { SetsRepository } from './sets.repository';

/** Bộ từ đã xoá mềm được giữ bao nhiêu ngày trước khi xoá hẳn. MVP không có thùng rác. */
export const DELETED_SET_RETENTION_DAYS = 30;
export const PURGE_BATCH_SIZE = 200;
/** Giới hạn số lô mỗi lần chạy để một lần chạy không kéo dài quá lâu. */
const MAX_BATCHES_PER_RUN = 50;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Đợi API khởi động xong và nhận request đầu tiên rồi mới chạy. */
const FIRST_RUN_DELAY_MS = 60 * 1000;

/**
 * Xoá hẳn bộ từ đã xoá mềm quá 30 ngày. Render gói Free ngủ khi rảnh nên job chạy mỗi lần
 * API khởi động và sau đó mỗi 24 giờ, khoá advisory giúp nhiều instance không xoá trùng.
 */
@Injectable()
export class SetsPurgeService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(SetsPurgeService.name);
  private timers: NodeJS.Timeout[] = [];

  constructor(
    private readonly repository: SetsRepository,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onApplicationBootstrap() {
    if (this.config.get('NODE_ENV', { infer: true }) === 'test') {
      return;
    }
    const run = () => {
      this.purge().catch((error: unknown) =>
        this.logger.error('Không xoá hẳn được bộ từ đã xoá mềm, lần sau sẽ chạy tiếp', error),
      );
    };
    this.timers = [setTimeout(run, FIRST_RUN_DELAY_MS), setInterval(run, DAY_MS)];
    // Hẹn giờ không giữ tiến trình sống khi API đang tắt.
    this.timers.forEach((timer) => timer.unref());
  }

  onApplicationShutdown() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
  }

  /** Trả số bộ từ đã xoá hẳn trong lần chạy này. */
  async purge(now = new Date()): Promise<number> {
    const before = new Date(now.getTime() - DELETED_SET_RETENTION_DAYS * DAY_MS);
    let purged = 0;
    for (let batch = 0; batch < MAX_BATCHES_PER_RUN; batch += 1) {
      const count = await this.repository.purgeDeletedBefore(before, PURGE_BATCH_SIZE);
      if (count === null) {
        this.logger.log('Bỏ qua lần xoá hẳn bộ từ vì instance khác đang chạy');
        break;
      }
      purged += count;
      if (count < PURGE_BATCH_SIZE) {
        break;
      }
    }
    this.logger.log(`Đã xoá hẳn ${purged} bộ từ đã xoá mềm trước ${before.toISOString()}`);
    return purged;
  }
}
