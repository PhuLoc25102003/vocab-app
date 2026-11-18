import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;
/** Chặn mật khẩu quá dài để không tốn tài nguyên khi hash. */
export const PASSWORD_MAX_LENGTH = 128;

export const emailSchema = z
  .string('Hãy nhập email')
  .trim()
  .toLowerCase()
  .max(254, 'Email quá dài')
  .pipe(z.email('Email không hợp lệ'));

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string('Hãy nhập mật khẩu')
    .min(PASSWORD_MIN_LENGTH, `Mật khẩu cần ít nhất ${PASSWORD_MIN_LENGTH} ký tự`)
    .max(PASSWORD_MAX_LENGTH, `Mật khẩu tối đa ${PASSWORD_MAX_LENGTH} ký tự`),
  displayName: z
    .string('Hãy nhập tên hiển thị')
    .trim()
    .min(1, 'Hãy nhập tên hiển thị')
    .max(100, 'Tên hiển thị tối đa 100 ký tự')
    .regex(/^\P{Cc}+$/u, 'Tên hiển thị chứa ký tự không hợp lệ'),
});
export type RegisterInput = z.infer<typeof registerSchema>;
