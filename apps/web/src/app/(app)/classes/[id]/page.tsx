import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { ClassDetail } from '@/features/classes/components/class-detail';
import { ClassesLoading } from '@/features/classes/components/teacher-classes';
import { Can } from '@/features/auth/components/can';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.classes') };
}

export default async function ClassDetailPage({ params }: PageProps<'/classes/[id]'>) {
  const t = await getT('common');
  const { id } = await params;
  return (
    <Can
      action="manage-classes"
      fallback={
        <EmptyState title={t('pages.teacherOnly')} description={t('pages.teacherOnlyClass')} />
      }
    >
      <Suspense fallback={<ClassesLoading />}>
        <ClassDetail id={id} />
      </Suspense>
    </Can>
  );
}
