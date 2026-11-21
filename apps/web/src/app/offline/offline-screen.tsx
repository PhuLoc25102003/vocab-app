'use client';

import { OfflineNotice } from '@/components/common/offline-notice';
import { OfflineStudyButton } from '@/features/study/components/offline-study';

/** Feature không import lẫn nhau, nên nút học offline được ghép ở tầng trang. */
export function OfflineScreen() {
  return <OfflineNotice renderSetAction={(setId) => <OfflineStudyButton setId={setId} />} />;
}
