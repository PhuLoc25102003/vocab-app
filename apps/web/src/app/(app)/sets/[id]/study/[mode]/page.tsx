import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AccountStudy } from '@/features/study/components/account-study';
import { parseStudyMode } from '@/features/study/modes/parse-mode';

export const metadata: Metadata = { title: 'Học bộ từ' };

export default async function StudyPage({
  params,
  searchParams,
}: PageProps<'/sets/[id]/study/[mode]'>) {
  const [{ id, mode: modeParam }, { due }] = await Promise.all([params, searchParams]);
  const mode = parseStudyMode(modeParam);
  if (!mode) {
    notFound();
  }
  return <AccountStudy setId={id} mode={mode} dueOnly={due === '1'} />;
}
