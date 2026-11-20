import type { Metadata } from 'next';
import { OfflineNotice } from '@/components/common/offline-notice';

export const metadata: Metadata = { title: 'Mất kết nối', robots: { index: false } };

export default function OfflinePage() {
  return <OfflineNotice />;
}
