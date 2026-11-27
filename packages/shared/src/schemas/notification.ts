import { z } from 'zod';
import { paginationMetaSchema, paginationSchema } from './pagination';

export const NOTIFICATION_TYPES = [
  /** Giáo viên giao bài cho lớp. `data`: `setTitle`, `className`, `dueAt`. */
  'ASSIGNMENT_NEW',
  /** Bài tập hết hạn trong 24 giờ mà chưa nộp. `data`: `setTitle`, `dueAt`. */
  'ASSIGNMENT_DUE',
  /** Đến giờ ôn tập. `data`: `count` thẻ đến hạn. */
  'REVIEW_DUE',
  /** Nhận huy hiệu. `data`: `code`. */
  'BADGE_EARNED',
  /** Đã dùng thẻ giữ chuỗi. `data`: `day`. */
  'STREAK_FROZEN',
] as const;
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

/** Dữ liệu để web dựng câu thông báo theo ngôn ngữ đang dùng. */
export const notificationDataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.null()]),
);
export type NotificationData = z.infer<typeof notificationDataSchema>;

export const notificationSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  data: notificationDataSchema,
  /** Trang mở khi bấm thông báo, `null` khi không có. */
  href: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type Notification = z.infer<typeof notificationSchema>;

/** Luôn xếp mới nhất trước, `sort` bị bỏ qua. */
export const notificationListQuerySchema = paginationSchema;
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;

export const notificationListSchema = z.object({
  data: z.array(notificationSchema),
  meta: paginationMetaSchema,
});
export type NotificationList = z.infer<typeof notificationListSchema>;

export const unreadCountResponseSchema = z.object({ data: z.object({ count: z.number() }) });

/** Thông báo cũ hơn số ngày này bị xoá. */
export const NOTIFICATION_RETENTION_DAYS = 90;

/** Loại thông báo được gửi thêm qua Web Push, theo thứ tự ưu tiên khi một người có nhiều nhắc. */
export const PUSH_NOTIFICATION_TYPES = [
  'ASSIGNMENT_DUE',
  'ASSIGNMENT_NEW',
  'REVIEW_DUE',
] as const satisfies readonly NotificationType[];

export const pushSubscriptionSchema = z.object({
  endpoint: z.url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(128),
  }),
});
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

export const pushUnsubscribeSchema = z.object({ endpoint: z.url().max(2048) });
export type PushUnsubscribeInput = z.infer<typeof pushUnsubscribeSchema>;

export const pushConfigResponseSchema = z.object({
  data: z.object({
    /** Máy chủ đã có khoá VAPID. */
    enabled: z.boolean(),
    publicKey: z.string(),
  }),
});
export type PushConfig = z.infer<typeof pushConfigResponseSchema>['data'];

/** Nội dung gửi tới service worker; câu chữ do service worker dựng theo ngôn ngữ. */
export interface PushPayload {
  type: NotificationType;
  data: NotificationData;
  href: string | null;
}
