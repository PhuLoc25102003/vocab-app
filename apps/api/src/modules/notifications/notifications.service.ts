import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ERROR_CODES,
  NOTIFICATION_RETENTION_DAYS,
  notificationDataSchema,
  notificationPrefsSchema,
  PUSH_NOTIFICATION_TYPES,
  type NotificationPrefs,
  type NotificationType,
  type Pagination,
  type PushPayload,
} from '@vocab/shared';
import { ok, paginated } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import type { Env } from '../../config/env';
import { NotificationsRepository, type NewNotification } from './notifications.repository';
import { PushService } from './push.service';
import { readUnsubscribeToken } from './unsubscribe-token';

const DAY_MS = 86_400_000;

const pushRank = (type: NotificationType) =>
  (PUSH_NOTIFICATION_TYPES as readonly NotificationType[]).indexOf(type);

/** Chọn cho mỗi người thông báo ưu tiên nhất trong các loại được đẩy. */
function pickPushes(rows: readonly ({ userId: string } & NewNotification)[]) {
  const picked = new Map<string, PushPayload>();
  for (const { userId, type, data, href } of rows) {
    const rank = pushRank(type);
    if (rank < 0) continue;
    const current = picked.get(userId);
    if (!current || rank < pushRank(current.type)) {
      picked.set(userId, { type, data, href });
    }
  }
  return picked;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notifications: NotificationsRepository,
    private readonly push: PushService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async prefs(userId: string): Promise<NotificationPrefs> {
    const row = await this.notifications.findPrefs(userId);
    return notificationPrefsSchema
      .catch(notificationPrefsSchema.parse({}))
      .parse(row?.notificationPrefs ?? {});
  }

  async updatePrefs(userId: string, changes: Partial<NotificationPrefs>) {
    const next = { ...(await this.prefs(userId)), ...changes };
    await this.notifications.savePrefs(userId, next);
    return ok(next);
  }

  /** Link "Huỷ nhận mail" trong mail nhắc học: tắt mọi mail nhắc, không cần đăng nhập. */
  async unsubscribe(token: string): Promise<void> {
    const userId = readUnsubscribeToken(
      token,
      this.config.get('JWT_REFRESH_SECRET', { infer: true }),
    );
    if (!userId || !(await this.notifications.findPrefs(userId))) {
      throw new AppError(
        ERROR_CODES.UNSUBSCRIBE_TOKEN_INVALID,
        'Liên kết huỷ nhận mail không hợp lệ',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.updatePrefs(userId, { reviewEmail: false, assignmentEmail: false });
  }

  async list(userId: string, query: Pagination) {
    const now = new Date();
    // Dọn thông báo cũ của người này khi họ mở chuông, không cần job hẹn giờ.
    await this.notifications.deleteOlderThan(
      userId,
      new Date(now.getTime() - NOTIFICATION_RETENTION_DAYS * DAY_MS),
    );
    const { items, total } = await this.notifications.findPage(userId, query);
    return paginated(
      items.map(({ data, readAt, createdAt, ...rest }) => ({
        ...rest,
        data: notificationDataSchema.catch({}).parse(data),
        readAt: readAt?.toISOString() ?? null,
        createdAt: createdAt.toISOString(),
      })),
      total,
      query,
    );
  }

  async unreadCount(userId: string) {
    return ok({ count: await this.notifications.countUnread(userId) });
  }

  async markRead(userId: string, id: string): Promise<void> {
    if (!(await this.notifications.markRead(userId, id, new Date()))) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy thông báo', HttpStatus.NOT_FOUND);
    }
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifications.markAllRead(userId, new Date());
  }

  /**
   * Gửi thông báo cho một nhóm người. Lỗi khi gửi chỉ ghi log, không làm hỏng việc chính
   * (giao bài, kết thúc phiên học).
   */
  async notify(userIds: readonly string[], notification: NewNotification): Promise<void> {
    await this.notifyEach(userIds.map((userId) => ({ userId, ...notification })));
  }

  /**
   * Mỗi người một thông báo riêng, ví dụ job nhắc học. Loại cần đẩy thì gửi thêm Web Push, mỗi
   * người tối đa một push mỗi lần gọi theo thứ tự `PUSH_NOTIFICATION_TYPES`.
   */
  async notifyEach(rows: readonly ({ userId: string } & NewNotification)[]): Promise<void> {
    try {
      await this.notifications.createMany(rows);
    } catch (error) {
      this.logger.error('Không tạo được thông báo', error);
      return;
    }
    try {
      await this.push.sendEach(pickPushes(rows));
    } catch (error) {
      this.logger.error('Không gửi được thông báo đẩy', error);
    }
  }

  /** Thông báo bài tập mới cho mọi học sinh trong lớp. */
  async notifyNewAssignment(
    classId: string,
    assignment: { id: string; setTitle: string; dueAt: string | null },
  ): Promise<void> {
    const found = await this.notifications.findClassMembers(classId);
    if (!found) return;
    await this.notify(
      found.members.map(({ userId }) => userId),
      {
        type: 'ASSIGNMENT_NEW',
        data: { setTitle: assignment.setTitle, className: found.name, dueAt: assignment.dueAt },
        href: `/classes/assignments/${assignment.id}`,
      },
    );
  }
}
