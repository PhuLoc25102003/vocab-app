import common from '@/locales/vi/common.json';
import marketing from '@/locales/vi/marketing.json';
import admin from '@/locales/vi/admin.json';
import account from '@/locales/vi/account.json';
import auth from '@/locales/vi/auth.json';
import classes from '@/locales/vi/classes.json';
import study from '@/locales/vi/study.json';
import sets from '@/locales/vi/sets.json';
import errors from '@/locales/vi/errors.json';
import validation from '@/locales/vi/validation.json';

/** Bộ chuỗi tiếng Việt, luôn có trong bundle vì là ngôn ngữ mặc định và ngôn ngữ dự phòng. */
export const vi = {
  common,
  marketing,
  admin,
  account,
  auth,
  classes,
  study,
  sets,
  errors,
  validation,
} as const;

export type Messages = typeof vi;
