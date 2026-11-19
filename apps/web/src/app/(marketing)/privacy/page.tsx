import type { Metadata } from 'next';
import { LegalPage } from '@/features/marketing/components/legal-page';
import {
  LEGAL_UPDATED_AT,
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
} from '@/features/marketing/legal-content';

export const metadata: Metadata = { title: 'Chính sách bảo mật' };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Chính sách bảo mật"
      updatedAt={LEGAL_UPDATED_AT}
      intro={PRIVACY_INTRO}
      sections={PRIVACY_SECTIONS}
    />
  );
}
