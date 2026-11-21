import type { Metadata } from 'next';
import { LanguageSettings } from '@/components/common/language-switcher';
import { SpeechSettings } from '@/components/common/speech-settings';
import { PageHeader } from '@/components/common/page-header';
import { AccountSettings } from '@/features/auth/components/account-settings';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.account') };
}

export default async function AccountPage() {
  const t = await getT('common');
  return (
    <>
      <PageHeader title={t('pages.account')} />
      <AccountSettings>
        <LanguageSettings />
        <SpeechSettings />
      </AccountSettings>
    </>
  );
}
