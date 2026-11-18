'use client';

import { useQuery } from '@tanstack/react-query';
import { healthResponseSchema } from '@vocab/shared';
import { http } from '@/lib/http';

export function HealthStatus() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async () => healthResponseSchema.parse(await http('/health')),
    retry: false,
  });

  let tone = 'text-text-muted';
  let label = 'Đang kiểm tra API…';

  if (health.isSuccess) {
    tone = 'text-success';
    label = `API: ${health.data.status} · Database: ${health.data.db}`;
  } else if (health.isError) {
    tone = 'text-danger';
    label = `Không kiểm tra được API: ${health.error.message}`;
  }

  return (
    <p role="status" className={`rounded-md border border-border bg-surface px-4 py-3 ${tone}`}>
      {label}
    </p>
  );
}
