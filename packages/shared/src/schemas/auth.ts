import { z } from 'zod';
import { vm } from '../validation';

export const PASSWORD_MIN_LENGTH = 8;
/** Chặn mật khẩu quá dài để không tốn tài nguyên khi hash. */
export const PASSWORD_MAX_LENGTH = 128;

export const roleSchema = z.enum(['STUDENT', 'TEACHER', 'ADMIN']);
export type Role = z.infer<typeof roleSchema>;

export const emailSchema = z
  .string(vm('required', { field: 'email' }))
  .trim()
  .toLowerCase()
  .max(254, vm('emailTooLong'))
  .pipe(z.email(vm('emailInvalid')));

const newPasswordSchema = z
  .string(vm('required', { field: 'password' }))
  .min(PASSWORD_MIN_LENGTH, vm('passwordTooShort', { min: PASSWORD_MIN_LENGTH }))
  .max(PASSWORD_MAX_LENGTH, vm('tooLong', { field: 'password', max: PASSWORD_MAX_LENGTH }));

/** Mật khẩu đã có: không áp độ dài tối thiểu, để đổi quy tắc sau này không khoá tài khoản cũ. */
const existingPasswordSchema = z
  .string(vm('required', { field: 'password' }))
  .min(1, vm('required', { field: 'password' }))
  .max(PASSWORD_MAX_LENGTH, vm('tooLong', { field: 'password', max: PASSWORD_MAX_LENGTH }));

export const displayNameSchema = z
  .string(vm('required', { field: 'displayName' }))
  .trim()
  .min(1, vm('required', { field: 'displayName' }))
  .max(100, vm('tooLong', { field: 'displayName', max: 100 }))
  .regex(/^\P{Cc}+$/u, vm('badChars', { field: 'displayName' }));

export const registerSchema = z.object({
  email: emailSchema,
  password: newPasswordSchema,
  displayName: displayNameSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/** Token trong liên kết đặt lại mật khẩu là 32 byte base64url, 43 ký tự. */
export const resetPasswordSchema = z.object({
  token: z.string(vm('linkInvalid')).regex(/^[A-Za-z0-9_-]{32,128}$/, vm('linkInvalid')),
  password: newPasswordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: existingPasswordSchema,
});
export type LoginInput = z.infer<typeof loginSchema>;

export const googleLoginSchema = z.object({
  credential: z.string(vm('googleMissing')).min(1, vm('googleMissing')).max(4096),
});
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;

/**
 * Nút Google ở chế độ redirect (mobile) POST form có `credential` về `login_uri`.
 * Cookie chứa nonce mà web đưa cho Google, API so với `nonce` trong ID token. */
export const GOOGLE_NONCE_COOKIE = 'google_nonce';
/** Chỉ gửi tới route nhận kết quả redirect. */
export const GOOGLE_NONCE_COOKIE_PATH = '/api/v1/auth/google/redirect';

export const updateAccountSchema = z
  .object({
    displayName: displayNameSchema.optional(),
    currentPassword: existingPasswordSchema.optional(),
    newPassword: newPasswordSchema.optional(),
  })
  .refine(({ displayName, newPassword }) => displayName !== undefined || newPassword, {
    message: vm('noChanges'),
  })
  .refine(({ currentPassword, newPassword }) => !newPassword || currentPassword, {
    path: ['currentPassword'],
    message: vm('currentPasswordRequired'),
  });
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

export const changeDisplayNameSchema = z.object({ displayName: displayNameSchema });
export type ChangeDisplayNameInput = z.infer<typeof changeDisplayNameSchema>;

export const changePasswordSchema = z.object({
  currentPassword: existingPasswordSchema,
  newPassword: newPasswordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const confirmPasswordSchema = z.object({ password: existingPasswordSchema });
export type ConfirmPasswordInput = z.infer<typeof confirmPasswordSchema>;

export const deleteAccountSchema = z.object({
  password: existingPasswordSchema.optional(),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string(),
  role: roleSchema,
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const authSessionSchema = z.object({
  user: authUserSchema,
  accessToken: z.string(),
});
export type AuthSession = z.infer<typeof authSessionSchema>;

export const accountSchema = authUserSchema.extend({ hasPassword: z.boolean() });
export type Account = z.infer<typeof accountSchema>;

export const accountResponseSchema = z.object({ data: z.object({ user: accountSchema }) });
export const updateAccountResponseSchema = z.object({
  data: z.object({ user: authUserSchema, accessToken: z.string().optional() }),
});
