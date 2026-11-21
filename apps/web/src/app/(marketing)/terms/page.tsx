import type { Metadata } from 'next';
import { LegalPage } from '@/features/marketing/components/legal-page';
import { LEGAL_UPDATED_AT, TERMS_INTRO, TERMS_SECTIONS } from '@/features/marketing/legal-content';
import {
  TERMS_INTRO_EN,
  TERMS_SECTIONS_EN,
  TERMS_TITLE_EN,
} from '@/features/marketing/legal-content.en';
import { getLocale, getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('marketing');
  return { title: t('legal.terms') };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const t = await getT('marketing');
  const isEn = locale === 'en';
  return (
    <LegalPage
      title={isEn ? TERMS_TITLE_EN : t('legal.terms')}
      updatedAt={LEGAL_UPDATED_AT}
      intro={isEn ? TERMS_INTRO_EN : TERMS_INTRO}
      sections={isEn ? TERMS_SECTIONS_EN : TERMS_SECTIONS}
    />
  );
}
