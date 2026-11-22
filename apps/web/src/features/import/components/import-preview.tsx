'use client';

import { cardInputSchema, type ImportRow } from '@vocab/shared';
import { Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { CardImage } from '@/components/common/card-image';
import { FormField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import { ImageSearchDialog } from '@/components/common/image-search-dialog';
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
  canSearch?: boolean;
}

export function ImportPreview({ rows, columns, onChange, canSearch = true }: ImportPreviewProps) {
  const { t } = useTranslation('sets');
  const invalidCount = rows.filter(({ errors }) => errors.length > 0).length;
  const [onlyInvalid, setOnlyInvalid] = useState(invalidCount > 0);
  const [activeSearchLine, setActiveSearchLine] = useState<number | null>(null);
  const activeSearchRow = rows.find((r) => r.line === activeSearchLine);
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

      <ol
        aria-label={t('import.previewTitle')}
        className="flex max-h-[60dvh] min-h-48 flex-col gap-3 overflow-y-auto overscroll-contain rounded-md border border-border bg-surface p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {visible.map((row) => {
          const errors = row.errors.length > 0 ? fieldErrors(row) : {};
          return (
            <li
              key={row.line}
              aria-label={t('import.row', { line: row.line })}
              data-invalid={row.errors.length > 0 || undefined}
              className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-4 data-invalid:border-danger-mark sm:flex-row sm:items-start"
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

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <span className="text-small font-medium">{t('image.label')}</span>
                  {row.imageUrl ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 rounded-xl border border-border/80 bg-surface/50 p-3 shadow-2xs">
                      <div className="relative group overflow-hidden rounded-lg border border-border bg-muted/20 shrink-0 w-32 h-24 sm:w-36 sm:h-24 shadow-2xs">
                        <CardImage
                          src={row.imageUrl}
                          alt={row.term}
                          className="w-full h-full object-cover border-none rounded-none transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {canSearch ? (
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-9 gap-1.5 border border-border font-medium hover:border-primary/50"
                            aria-label={t('image.searchAnotherFor', { number: row.line })}
                            onClick={() => setActiveSearchLine(row.line)}
                          >
                            <Search aria-hidden className="size-4 text-primary" />
                            {t('image.searchAnother')}
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-9 gap-1.5 border border-border font-medium text-danger hover:border-danger/40 hover:bg-danger-soft hover:text-danger"
                          aria-label={t('image.removeFor', { number: row.line })}
                          onClick={() => update(row.line, 'imageUrl', '')}
                        >
                          <X aria-hidden className="size-4" />
                          {t('image.remove')}
                        </Button>
                        {columns.image ? (
                          <div className="w-full sm:w-auto sm:flex-1">
                            <FormField
                              label={t('import.image')}
                              value={row.imageUrl ?? ''}
                              error={errors.imageUrl}
                              onChange={(event) => update(row.line, 'imageUrl', event.target.value)}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2.5">
                      {canSearch ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-9.5 gap-2 border border-border font-medium shadow-2xs hover:border-primary/60 hover:bg-primary-soft/40"
                          aria-label={t('image.searchFor', { number: row.line })}
                          onClick={() => setActiveSearchLine(row.line)}
                        >
                          <Search aria-hidden className="size-4 text-primary" />
                          {t('image.searchOnline')}
                        </Button>
                      ) : null}
                      {columns.image ? (
                        <div className="w-full sm:w-auto sm:flex-1">
                          <FormField
                            label={t('import.image')}
                            value={row.imageUrl ?? ''}
                            error={errors.imageUrl}
                            onChange={(event) => update(row.line, 'imageUrl', event.target.value)}
                          />
                        </div>
                      ) : null}
                    </div>
                  )}
                  {!columns.image && errors.imageUrl ? (
                    <p role="alert" className="text-small text-danger">
                      {errors.imageUrl}
                    </p>
                  ) : null}
                </div>
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

      {activeSearchRow ? (
        <ImageSearchDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setActiveSearchLine(null);
          }}
          initialQuery={activeSearchRow.term || ''}
          onSelectImage={(url) => {
            update(activeSearchRow.line, 'imageUrl', url);
            setActiveSearchLine(null);
          }}
        />
      ) : null}
    </section>
  );
}
