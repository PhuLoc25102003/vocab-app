'use client';

import { cardInputSchema, type ImportRow } from '@vocab/shared';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FormField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';

type RowField = 'term' | 'definition';

/** Lỗi đầu tiên của từng ô, dùng cùng schema với API. */
function fieldErrors(row: ImportRow): Partial<Record<RowField, string>> {
  const result = cardInputSchema.safeParse({ term: row.term, definition: row.definition });
  const errors: Partial<Record<RowField, string>> = {};
  for (const issue of result.success ? [] : result.error.issues) {
    const field = issue.path[0] as RowField;
    errors[field] ??= issue.message;
  }
  return errors;
}

/** Chấm lại một dòng sau khi người dùng sửa. */
export function validateRow(row: ImportRow): ImportRow {
  return { ...row, errors: Object.values(fieldErrors(row)) };
}

interface ImportPreviewProps {
  rows: ImportRow[];
  onChange: (rows: ImportRow[]) => void;
}

export function ImportPreview({ rows, onChange }: ImportPreviewProps) {
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
            Xem trước <span className="tabular-nums">({rows.length} thẻ)</span>
          </h2>
          <p className="text-small text-text-muted" aria-live="polite">
            {invalidCount > 0
              ? `${invalidCount} dòng cần sửa hoặc bỏ trước khi lưu.`
              : 'Mọi dòng đều hợp lệ.'}
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
            Chỉ hiện dòng lỗi
          </label>
        ) : null}
      </div>

      <ol className="flex flex-col gap-3">
        {visible.map((row) => {
          const errors = row.errors.length > 0 ? fieldErrors(row) : {};
          return (
            <li
              key={row.line}
              aria-label={`Dòng ${row.line}`}
              data-invalid={row.errors.length > 0 || undefined}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 data-invalid:border-danger-mark sm:flex-row sm:items-start"
            >
              <span className="text-small text-text-muted tabular-nums sm:w-16 sm:pt-9">
                Dòng {row.line}
              </span>
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <FormField
                  label="Từ"
                  value={row.term}
                  error={errors.term}
                  onChange={(event) => update(row.line, 'term', event.target.value)}
                />
                <FormField
                  label="Nghĩa"
                  value={row.definition}
                  error={errors.definition}
                  onChange={(event) => update(row.line, 'definition', event.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="self-end sm:mt-6 sm:self-start"
                aria-label={`Bỏ dòng ${row.line}`}
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
