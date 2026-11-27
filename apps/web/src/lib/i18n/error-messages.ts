import enErrors from '@/locales/en/errors.json';
import enValidation from '@/locales/en/validation.json';
import viErrors from '@/locales/vi/errors.json';
import viValidation from '@/locales/vi/validation.json';

/** Hai namespace nhỏ mà `form-errors` và `validation-message` đọc trực tiếp, đủ hai ngôn ngữ. */
export const errorMessages = { vi: viErrors, en: enErrors } as const;
export const validationMessages = { vi: viValidation, en: enValidation } as const;
