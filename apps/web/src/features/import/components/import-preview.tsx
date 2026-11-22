'use client';

import { cardInputSchema, type ImportRow } from '@vocab/shared';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FormField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import type { ImportExtraColumns } from './import-source';
import { translateValidation } from '@/lib/validation-message';
import { useTranslation } from 'react-i18next';

type RowField = 'term' | 'definition' | 'phonetic' | 'example' | 'imageUrl';

/** Lỗi đầu tiên của từng ô, dùng cùng schema với API. */
function fieldErrors(row: ImportRow): Partial<Record<RowField, string>> {
  const result = cardInputSchema.safeParse({
    term: row.term,
    definition: row.definition,
    phonetic: row.phonetic || undefined,
    example: row.example || undefined,
    imageUrl: row.imageUrl || undefined,
  });
  const errors: Partial<Record<RowField, string>> = {};
  for (const issue of result.success ? [] : result.error.issues) {
    const field = issue.path[0] as RowField;
    errors[field] ??= translateValidation(issue.message);
  }
  return errors;
}

/** Chấm lại một dòng sau khi người dùng sửa. */
export function validateRow(row: ImportRow): ImportRow {
  return { ...row, errors: Object.values(fieldErrors(row)) };
}

interface ImportPreviewProps {
  rows: ImportRow[];
  columns: ImportExtraColumns;
  onChange: (rows: ImportRow[]) => void;
}

export function ImportPreview({ rows, columns, onChange }: ImportPreviewProps) {
  const { t } = useTranslation('sets');
  const invalidCount = rows.filter(({ errors }) => errors.length > 0).length;
  const [onlyInvalid, setOnlyInvalid] = useState(invalidCount > 0);
  const visible = onlyInvalid && invalidCount > 0 ? rows.filter((row) => row.errors.length) : rows;

  const update = (line: number, field: RowField, value: string) =>
    onChange(
      rows.map((row) => (row.line === line ? validateRow({ ...row, [field]: value }) : row)),
    );
  const remove = (line: number) => onChange(rows.filter((row) => row.line !== line));

  return (
    <section aria-labelledby="preview-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="preview-title" className="text-h2">
            {t('import.previewTitle')}{' '}
            <span className="tabular-nums">{t('import.previewCount', { count: rows.length })}</span>
          </h2>
          <p className="text-small text-text-muted" aria-live="polite">
            {invalidCount > 0
              ? t('import.invalidRows', { count: invalidCount })
              : t('import.allValid')}
          </p>
        </div>
        {invalidCount > 0 ? (
          <label className="flex min-h-11 items-center gap-3 text-body">
            <input
              type="checkbox"
              className="size-11 shrink-0 accent-primary"
              checked={onlyInvalid}
              onChange={(event) => setOnlyInvalid(event.target.checked)}
            />
            {t('import.onlyInvalid')}
          </label>
        ) : null}
      </div>

      <ol className="flex flex-col gap-3">
        {visible.map((row) => {
          const errors = row.errors.length > 0 ? fieldErrors(row) : {};
          return (
            <li
              key={row.line}
              aria-label={t('import.row', { line: row.line })}
              data-invalid={row.errors.length > 0 || undefined}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 data-invalid:border-danger-mark sm:flex-row sm:items-start"
            >
              <span className="text-small text-text-muted tabular-nums sm:w-16 sm:pt-9">
                {t('import.row', { line: row.line })}
              </span>
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <FormField
                  label={t('import.term')}
                  value={row.term}
                  error={errors.term}
                  onChange={(event) => update(row.line, 'term', event.target.value)}
                />
                <FormField
                  label={t('import.definition')}
                  value={row.definition}
                  error={errors.definition}
                  onChange={(event) => update(row.line, 'definition', event.target.value)}
                />
                {columns.phonetic ? (
                  <FormField
                    label={t('import.phonetic')}
                    value={row.phonetic ?? ''}
                    error={errors.phonetic}
                    onChange={(event) => update(row.line, 'phonetic', event.target.value)}
                  />
                ) : null}
                {columns.example ? (
                  <FormField
                    label={t('import.example')}
                    value={row.example ?? ''}
                    error={errors.example}
                    onChange={(event) => update(row.line, 'example', event.target.value)}
                  />
                ) : null}
                {columns.image ? (
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <FormField
                      label={t('import.image')}
                      value={row.imageUrl ?? ''}
                      error={errors.imageUrl}
                      onChange={(event) => update(row.line, 'imageUrl', event.target.value)}
                    />
                    {row.imageUrl ? (
                      <div className="mt-1 flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.imageUrl}
                          alt={row.term}
                          className="size-12 rounded border border-border object-cover"
                        />
                        <span className="truncate text-xs text-text-muted">{row.imageUrl}</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="self-end sm:mt-6 sm:self-start"
                aria-label={t('import.removeRow', { line: row.line })}
                onClick={() => remove(row.line)}
              >
                <Trash2 aria-hidden className="size-4" />
              </Button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
