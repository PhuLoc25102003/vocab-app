import type { Metadata } from 'next';
import { LegalPage } from '@/features/marketing/components/legal-page';
import {
  LEGAL_UPDATED_AT,
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
} from '@/features/marketing/legal-content';
import {
  PRIVACY_INTRO_EN,
  PRIVACY_SECTIONS_EN,
  PRIVACY_TITLE_EN,
} from '@/features/marketing/legal-content.en';
import { getLocale, getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('marketing');
  return { title: t('legal.privacy') };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = await getT('marketing');
  const isEn = locale === 'en';
  return (
    <LegalPage
      title={isEn ? PRIVACY_TITLE_EN : t('legal.privacy')}
      updatedAt={LEGAL_UPDATED_AT}
      intro={isEn ? PRIVACY_INTRO_EN : PRIVACY_INTRO}
      sections={isEn ? PRIVACY_SECTIONS_EN : PRIVACY_SECTIONS}
    />
  );
}
