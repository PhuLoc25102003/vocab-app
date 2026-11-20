import type { Metadata } from 'next';
import { OfflineScreen } from './offline-screen';

export const metadata: Metadata = { title: 'Mất kết nối', robots: { index: false } };

export default function OfflinePage() {
  return <OfflineScreen />;
}
