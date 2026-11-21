import Link from 'next/link';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { getT } from '@/lib/i18n/server';

export default async function PublicSetNotFound() {
  const t = await getT('sets');
  const tCommon = await getT('common');
  return (
    <EmptyState
      title={t('notFound')}
      description={t('notFoundHint')}
      action={
        <Button asChild variant="secondary">
          <Link href="/">{tCommon('session.home')}</Link>
        </Button>
      }
    />
  );
}
