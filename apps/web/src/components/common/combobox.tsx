'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Dòng phụ dưới nhãn, ví dụ "12 thẻ · Riêng tư". */
  description?: string;
  /** Chữ tìm được thêm ngoài nhãn, ví dụ tên giáo viên của lớp. Không hiển thị. */
  keywords?: string;
}

interface ComboboxProps {
  label: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  /** Câu khi gõ mà không mục nào khớp. */
  emptyText?: string;
  name?: string;
  disabled?: boolean;
  onBlur?: () => void;
  /**
   * Danh sách nằm trong luồng trang thay vì nổi lên trên: dùng trong hộp thoại có thân cuộn được,
   * nơi danh sách nổi bị cắt. Hộp thoại chỉ cao thêm khi danh sách đang mở.
   */
  inline?: boolean;
}

/** Bỏ dấu, `đ` thành `d`, chữ thường: gõ "tieng viet" vẫn ra "Tiếng Việt". */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi')
    .trim();
}

/**
 * Ô chọn có tìm kiếm ngay trong ô, theo mẫu ARIA combobox với listbox. Dùng khi danh sách có thể
 * quá 8 mục; danh sách ngắn và cố định giữ `Select`.
 */
export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder,
  hint,
  error,
  emptyText,
  name,
  disabled = false,
  onBlur,
  inline = false,
}: ComboboxProps) {
  const { t } = useTranslation();
  const id = useId();
  const listId = `${id}-list`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const selected = options.find((option) => option.value === value);
  const matches = useMemo(() => {
    const needle = normalizeSearch(query ?? '');
    return needle
      ? options.filter((option) =>
          normalizeSearch(`${option.label} ${option.keywords ?? ''}`).includes(needle),
        )
      : options;
  }, [options, query]);
  const activeOption = open ? matches[Math.min(active, matches.length - 1)] : undefined;
  const optionId = (index: number) => `${id}-option-${index}`;

  const show = (startAt = matches.findIndex((option) => option.value === value)) => {
    setOpen(true);
    setActive(Math.max(startAt, 0));
  };

  const close = () => {
    setOpen(false);
    setQuery(null);
  };

  const choose = (option: ComboboxOption) => {
    onChange(option.value);
    close();
  };

  const move = (next: number) => {
    if (matches.length === 0) return;
    const index = (next + matches.length) % matches.length;
    setActive(index);
    document.getElementById(optionId(index))?.scrollIntoView?.({ block: 'nearest' });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (open) move(active + 1);
        else show();
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (open) move(active - 1);
        else show();
        break;
      case 'Enter':
        if (open) {
          // Không gửi form khi đang chọn trong danh sách.
          event.preventDefault();
          if (activeOption) choose(activeOption);
        }
        break;
      case 'Escape':
        if (open) {
          // Chỉ đóng danh sách, không đóng hộp thoại chứa ô này.
          event.preventDefault();
          event.stopPropagation();
          close();
        }
        break;
      case 'Tab':
        close();
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-small font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOption ? optionId(matches.indexOf(activeOption)) : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          disabled={disabled}
          placeholder={selected ? undefined : (placeholder ?? t('combobox.placeholder'))}
          value={query ?? selected?.label ?? ''}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onClick={() => {
            if (!open) show();
          }}
          onFocus={(event) => event.currentTarget.select()}
          onBlur={() => {
            close();
            onBlur?.();
          }}
          onKeyDown={onKeyDown}
          className="min-h-11 w-full rounded-md border border-border-strong bg-surface py-2 pr-10 pl-3 text-body transition-colors duration-fast ease-standard hover:border-text-muted focus-visible:border-primary disabled:bg-bg aria-invalid:border-danger-mark"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={t(open ? 'combobox.close' : 'combobox.open', { label })}
          disabled={disabled}
          // Giữ focus ở ô nhập để bàn phím và trình đọc màn hình không mất vị trí.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            inputRef.current?.focus();
            if (open) close();
            else show();
          }}
          className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center text-text-muted"
        >
          <ChevronDown
            aria-hidden
            className={cn(
              'size-4 transition-transform duration-fast ease-standard motion-reduce:transition-none',
              open && 'rotate-180',
            )}
          />
        </button>
        <ul
          id={listId}
          role="listbox"
          aria-label={t('combobox.options', { label })}
          hidden={!open}
          className={cn(
            'glass-overlay glass-pop mt-1.5 max-h-64 origin-top overflow-y-auto overscroll-contain rounded-menu p-1.5',
            inline ? 'relative' : 'absolute inset-x-0 top-full z-10',
          )}
        >
          {matches.length === 0 ? (
            <li role="presentation" className="px-3 py-2 text-small text-text-muted">
              {emptyText ?? t('combobox.empty')}
            </li>
          ) : (
            matches.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseMove={() => setActive(index)}
                  onClick={() => choose(option)}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl px-3 py-2',
                    option === activeOption && 'bg-primary-soft',
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="wrap-anywhere">{option.label}</span>
                    {option.description ? (
                      <span className="text-small text-text-muted">{option.description}</span>
                    ) : null}
                  </span>
                  {isSelected ? (
                    <Check aria-hidden className="size-4 shrink-0 text-primary" />
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      </div>
      {hint ? (
        <p id={hintId} className="text-small text-text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-small text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
