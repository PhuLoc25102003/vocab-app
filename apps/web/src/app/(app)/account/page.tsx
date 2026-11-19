import type { Metadata } from 'next';
import Link from 'next/link';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { SpeechSettings } from '@/components/common/speech-settings';
import { Button } from '@/components/ui/button';
import { AccountSettings } from '@/features/auth/components/account-settings';
import { Can } from '@/features/auth/components/can';

export const metadata: Metadata = { title: 'Tài khoản' };

export default function AccountPage() {
  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Tài khoản"
        actions={
          <Can action="manage-users">
            <Button asChild variant="secondary">
              <Link href="/admin/users">Quản lý người dùng</Link>
            </Button>
          </Can>
        }
      />
      <AccountSettings />
      <SpeechSettings />
    </PageContainer>
  );
}
