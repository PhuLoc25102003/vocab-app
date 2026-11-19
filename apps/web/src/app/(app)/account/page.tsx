import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { AccountSettings } from '@/features/auth/components/account-settings';
import { Can } from '@/features/auth/components/can';

export const metadata: Metadata = { title: 'Tài khoản' };

export default function AccountPage() {
  return (
    <>
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
    </>
  );
}
