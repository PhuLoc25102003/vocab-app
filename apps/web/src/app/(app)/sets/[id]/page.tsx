import type { Metadata } from 'next';
import { SetDetailScreen } from './set-detail-screen';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.setDetail') };
}

export default async function SetDetailPage({ params }: PageProps<'/sets/[id]'>) {
  const { id } = await params;
  return <SetDetailScreen id={id} />;
}
