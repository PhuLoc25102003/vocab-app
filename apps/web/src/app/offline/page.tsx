import type { Metadata } from 'next';
import { OfflineScreen } from './offline-screen';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.offlineTitle'), robots: { index: false } };
}

export default function OfflinePage() {
  return <OfflineScreen />;
}
