import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { GuestStudy } from '@/features/study/components/guest-study';
import { parseStudyMode } from '@/features/study/modes/parse-mode';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('sets');
  return { title: t('grid.guestLabel'), robots: { index: false } };
}

type GuestStudyPageProps = PageProps<'/public/sets/[id]/study/[mode]'>;

async function GuestStudyContent({ params }: Pick<GuestStudyPageProps, 'params'>) {
  const { id, mode: modeParam } = await params;
  const mode = parseStudyMode(modeParam);
  if (!mode) {
    notFound();
  }
  return <GuestStudy setId={id} mode={mode} />;
}

export default function GuestStudyPage({ params }: GuestStudyPageProps) {
  return (
    <Suspense>
      <GuestStudyContent params={params} />
    </Suspense>
  );
}
