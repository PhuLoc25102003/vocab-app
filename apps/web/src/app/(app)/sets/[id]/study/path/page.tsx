import type { Metadata } from 'next';
import { StudyPath } from '@/features/study/components/study-path';
import { toPathStep } from '@/features/study/path-steps';

export const metadata: Metadata = { title: 'Lộ trình học' };

export default async function StudyPathPage({
  params,
  searchParams,
}: PageProps<'/sets/[id]/study/path'>) {
  const [{ id }, { step }] = await Promise.all([params, searchParams]);
  return <StudyPath setId={id} step={toPathStep(typeof step === 'string' ? step : undefined)} />;
}
