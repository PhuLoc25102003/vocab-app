import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { MemberResults } from '@/features/classes/components/member-results';
import { ClassesLoading } from '@/features/classes/components/teacher-classes';
import { Can } from '@/features/auth/components/can';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.studentResults') };
}

export default async function MemberResultsPage({
  params,
}: PageProps<'/classes/[id]/members/[userId]'>) {
  const t = await getT('common');
  const { id, userId } = await params;
  return (
    <Can
      action="manage-classes"
      fallback={
        <EmptyState title={t('pages.teacherOnly')} description={t('pages.teacherOnlyStudent')} />
      }
    >
      <Suspense fallback={<ClassesLoading />}>
        <MemberResults classId={id} userId={userId} />
      </Suspense>
    </Can>
  );
}
