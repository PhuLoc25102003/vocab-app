import type { Metadata } from 'next';
import { SetDetailScreen } from './set-detail-screen';

export const metadata: Metadata = { title: 'Chi tiết bộ từ' };

export default async function SetDetailPage({ params }: PageProps<'/sets/[id]'>) {
  const { id } = await params;
  return <SetDetailScreen id={id} />;
}
