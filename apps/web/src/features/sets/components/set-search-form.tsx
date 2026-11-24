'use client';

import { publicSetQuerySchema } from '@vocab/shared';
import { Search } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

const MAX_QUERY_LENGTH = 100;
export const QUERY_FIELD = 'q';

export function toQuery(value: string | null): string {
  const q = publicSetQuerySchema.shape.q.safeParse(value ?? undefined);
  return q.success ? (q.data ?? '') : '';
}

interface SetSearchFormProps {
  id: string;
  value: string;
  onSearch: (value: string) => void;
}

export function SetSearchForm({ id, value, onSearch }: SetSearchFormProps) {
  const { t } = useTranslation('sets');
  const [prevValue, setPrevValue] = useState(value);
  const [draft, setDraft] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  useEffect(() => {
    const trimmed = draft.trim();
    if (trimmed === value) return;
    const timer = setTimeout(() => {
      onSearch(trimmed);
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, value, onSearch]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(draft.trim());
  };

  return (
    <form role="search" onSubmit={submit} className="relative w-full">
      <label htmlFor={id} className="sr-only">
        {t('search.label')}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
      />
      <Input
        id={id}
        name={QUERY_FIELD}
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={MAX_QUERY_LENGTH}
        placeholder={t('search.placeholder')}
        className="w-full pl-9"
      />
    </form>
  );
}
