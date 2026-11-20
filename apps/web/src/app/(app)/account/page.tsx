import type { Metadata } from 'next';
import { SpeechSettings } from '@/components/common/speech-settings';
import { PageHeader } from '@/components/common/page-header';
import { AccountSettings } from '@/features/auth/components/account-settings';

export const metadata: Metadata = { title: 'Tài khoản' };

export default function AccountPage() {
  return (
    <>
      <PageHeader title="Tài khoản" />
      <AccountSettings>
        <SpeechSettings />
      </AccountSettings>
    </>
  );
}
