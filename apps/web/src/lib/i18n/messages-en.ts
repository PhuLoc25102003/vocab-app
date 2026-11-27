import common from '@/locales/en/common.json';
import marketing from '@/locales/en/marketing.json';
import admin from '@/locales/en/admin.json';
import account from '@/locales/en/account.json';
import auth from '@/locales/en/auth.json';
import classes from '@/locales/en/classes.json';
import study from '@/locales/en/study.json';
import sets from '@/locales/en/sets.json';
import errors from '@/locales/en/errors.json';
import validation from '@/locales/en/validation.json';
import type { Messages } from './messages-vi';

/** Bộ chuỗi tiếng Anh. Client chỉ tải khi cần (`loadLocale`), server dùng qua `resources`. */
export const en: Messages = {
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
};
