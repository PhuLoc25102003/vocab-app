import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AccountStudy } from '@/features/study/components/account-study';
import { AssignmentStudy } from '@/features/study/components/assignment-study';
import { parseStudyMode } from '@/features/study/modes/parse-mode';
import { parseModeList } from '@/features/study/review-chain';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.study') };
}

export default async function StudyPage({
  params,
  searchParams,
}: PageProps<'/sets/[id]/study/[mode]'>) {
  const [{ id, mode: modeParam }, { due, assignment, next, review }] = await Promise.all([
    params,
    searchParams,
  ]);
  const mode = parseStudyMode(modeParam);
  if (!mode) {
    notFound();
  }
  if (typeof assignment === 'string' && assignment) {
    return <AssignmentStudy setId={id} mode={mode} assignmentId={assignment} />;
  }
  return (
    <AccountStudy
      key={`${id}-${mode}`}
      setId={id}
      mode={mode}
      dueOnly={due === '1'}
      review={review === '1'}
      next={parseModeList(typeof next === 'string' ? next : undefined).filter(
        (item) => item !== mode,
      )}
    />
  );
}
