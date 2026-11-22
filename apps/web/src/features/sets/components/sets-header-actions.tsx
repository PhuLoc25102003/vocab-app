'use client';

import { FileUp, Plus } from 'lucide-react';
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
        <Link href={importHref} className="flex items-center gap-1.5">
          <FileUp aria-hidden className="size-4 shrink-0" />
          <span>{t('pages.importFromFile')}</span>
        </Link>
      </Button>
      <Button asChild>
        <Link href={newSetHref} className="flex items-center gap-1.5">
          <Plus aria-hidden className="size-4 shrink-0" />
          <span>{t('pages.createSet')}</span>
        </Link>
      </Button>
    </>
  );
}
