import type { Metadata } from 'next';
import { LegalPage } from '@/features/marketing/components/legal-page';
import { LEGAL_UPDATED_AT, TERMS_INTRO, TERMS_SECTIONS } from '@/features/marketing/legal-content';

export const metadata: Metadata = { title: 'Điều khoản sử dụng' };

export default function TermsPage() {
  return (
    <LegalPage
      title="Điều khoản sử dụng"
      updatedAt={LEGAL_UPDATED_AT}
      intro={TERMS_INTRO}
      sections={TERMS_SECTIONS}
    />
  );
}
