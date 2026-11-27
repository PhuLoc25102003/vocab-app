import { parseValidationMessage } from '@vocab/shared';
import { getI18n } from 'react-i18next';
import { toLocale } from './i18n/config';
import { validationMessages } from './i18n/error-messages';

type Table = Partial<Record<string, string>>;

/**
 * Dịch thông báo validate dạng khoá của shared (`v:required|{"field":"term"}`) theo ngôn ngữ đang
 * dùng (việc 6.2b). Tham số `field` lấy tên trường đã dịch; chuỗi không phải khoá giữ nguyên.
 */
export function translateValidation(message: string): string;
export function translateValidation(message: string | undefined): string | undefined;
export function translateValidation(message: string | undefined): string | undefined {
  if (!message) return message;
  const parsed = parseValidationMessage(message);
  if (!parsed) return message;
  const { messages, fields, fieldTitles } = validationMessages[toLocale(getI18n()?.language)];
  const template = (messages as Table)[parsed.key];
  if (!template) return message;
  const values: Record<string, string> = {};
  for (const [name, value] of Object.entries(parsed.params)) values[name] = String(value);
  const field = parsed.params.field;
  if (typeof field === 'string') {
    values.field = (fields as Table)[field] ?? field;
    values.Field = (fieldTitles as Table)[field] ?? values.field;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => values[name] ?? match);
}
