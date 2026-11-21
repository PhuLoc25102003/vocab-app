import type { Metadata } from 'next';
import { StudyPath } from '@/features/study/components/study-path';
import { toPathStep } from '@/features/study/path-steps';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.studyPath') };
}

export default async function StudyPathPage({
  params,
  searchParams,
}: PageProps<'/sets/[id]/study/path'>) {
  const [{ id }, { step }] = await Promise.all([params, searchParams]);
  return <StudyPath setId={id} step={toPathStep(typeof step === 'string' ? step : undefined)} />;
}
