'use client';

import { publicSetQuerySchema } from '@vocab/shared';
import { Search } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = new FormData(event.currentTarget).get(QUERY_FIELD);
    onSearch(typeof next === 'string' ? next.trim() : '');
  };

  return (
    <form role="search" onSubmit={submit} className="flex w-full max-w-[560px] gap-2">
      <label htmlFor={id} className="sr-only">
        Tìm bộ từ theo tên
      </label>
      <Input
        // Giữ ô tìm kiếm đúng với URL khi bấm quay lại trên trình duyệt.
        key={value}
        id={id}
        name={QUERY_FIELD}
        type="search"
        defaultValue={value}
        maxLength={MAX_QUERY_LENGTH}
        placeholder="Tìm theo tên bộ từ"
      />
      <Button type="submit">
        <Search aria-hidden className="size-4" />
        Tìm
      </Button>
    </form>
  );
}
