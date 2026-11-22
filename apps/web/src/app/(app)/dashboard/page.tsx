import type { Metadata } from 'next';
import { DashboardScreen } from './dashboard-screen';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.dashboard') };
}

/** Mỗi vai trò một Tổng quan: ADMIN ở trên cùng, giáo viên và học sinh theo vai trò. */
export default function DashboardPage() {
  return <DashboardScreen />;
}
