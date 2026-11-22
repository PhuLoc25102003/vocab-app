'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function SetsHeaderActions() {
  const { t } = useTranslation('common');
  const searchParams = useSearchParams();
  const folder = searchParams.get('folder');
  const folderId = folder && folder !== 'none' ? folder : undefined;

  const newSetHref = (folderId ? `/sets/new?folder=${folderId}` : '/sets/new') as Route;
  const importHref = (folderId ? `/sets/import?folder=${folderId}` : '/sets/import') as Route;

  return (
    <>
      <Button asChild variant="secondary">
        <Link href={importHref}>{t('pages.importFromFile')}</Link>
      </Button>
      <Button asChild>
        <Link href={newSetHref}>{t('pages.createSet')}</Link>
      </Button>
    </>
  );
}
