import type { Visibility } from '@vocab/shared';
import { Globe, Lock, Users, type LucideIcon } from 'lucide-react';
import { useId } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const ICONS: Record<Visibility, LucideIcon> = { PRIVATE: Lock, PUBLIC: Globe, CLASS: Users };

interface VisibilityFieldProps extends UseFormRegisterReturn {
  options: readonly Visibility[];
  error?: string;
}

/** Chọn ai xem được bộ từ bằng các thẻ có mô tả, thay ô chọn chỉ có tên. */
export function VisibilityField({ options, error, ...field }: VisibilityFieldProps) {
  const { t } = useTranslation();
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <fieldset aria-describedby={error ? errorId : undefined} className="flex flex-col gap-1">
      <legend className="mb-1 text-small font-medium">{t('visibility.legend')}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((visibility) => {
          const Icon = ICONS[visibility];
          const titleId = `${id}-${visibility}-title`;
          const descriptionId = `${id}-${visibility}`;
          return (
            <label
              key={visibility}
              className="group flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-border-strong bg-surface p-3 transition-colors duration-fast ease-standard hover:border-text-muted has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
            >
              {/* Cả thẻ là vùng bấm, nút radio gốc ẩn đi và vẽ lại bằng chấm tròn. */}
              <input
                type="radio"
                value={visibility}
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className="sr-only"
                {...field}
              />
              <span
                aria-hidden
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-border-strong bg-surface group-has-checked:border-primary"
              >
                <span className="size-2.5 rounded-full group-has-checked:bg-primary" />
              </span>
              <span className="flex flex-col gap-1">
                <span id={titleId} className="flex items-center gap-2 font-medium">
                  <Icon aria-hidden className="size-4 text-primary" />
                  {t(`visibility.${visibility}`)}
                </span>
                <span id={descriptionId} className="text-small text-text-muted">
                  {t(`visibilityHint.${visibility}`)}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} className="text-small text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
