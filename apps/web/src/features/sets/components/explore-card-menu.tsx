'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import type { PublicSetSummary } from '@vocab/shared';
import { Copy, GraduationCap, Link2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/menu';
import { formErrorMessage } from '@/lib/form-errors';
import { useDuplicateSet } from '../hooks/use-set';
import { useTranslation } from 'react-i18next';

export interface ExploreCardMenuProps {
  set: PublicSetSummary;
  href: Route;
  audience?: 'member' | 'guest';
  extraMenuItems?: ReactNode;
  extraDialogs?: ReactNode;
}

/** Menu chuột phải cho thẻ bộ từ công khai ở Khám phá. */
export function ExploreContextMenuContent({
  set,
  href,
  audience = 'member',
  extraMenuItems,
  extraDialogs,
}: ExploreCardMenuProps) {
  const { t } = useTranslation('sets');
  const router = useRouter();
  const duplicateSet = useDuplicateSet(set.id);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${href}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success(t('actions.linkCopied')))
      .catch(() => undefined);
  };

  const handleCopySet = () => {
    if (audience === 'guest') {
      router.push('/login' as Route);
      return;
    }
    duplicateSet.mutate(undefined, {
      onSuccess: (copy) => {
        toast.success(t('actions.copied'));
        router.push(`/sets/${copy.id}` as Route);
      },
      onError: (err) => toast.error(formErrorMessage(err)),
    });
  };

  return (
    <>
      <ContextMenuContent>
        <ContextMenuItem asChild>
          <Link href={href}>
            <GraduationCap aria-hidden className="size-4" />
            <span>{t(audience === 'guest' ? 'grid.guestLabel' : 'actions.startStudy')}</span>
          </Link>
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleCopySet} disabled={duplicateSet.isPending}>
          <Copy aria-hidden className="size-4" />
          <span>{t('actions.copyToLibrary')}</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleCopyLink}>
          <Link2 aria-hidden className="size-4" />
          <span>{t('actions.copyLink')}</span>
        </ContextMenuItem>
        {extraMenuItems}
      </ContextMenuContent>
      {extraDialogs}
    </>
  );
}

/** Nút ba chấm trên thẻ bộ từ công khai, tối ưu cho mobile và thao tác nhanh. */
export function ExploreCardActionsDropdown({
  set,
  href,
  audience = 'member',
  extraMenuItems,
  extraDialogs,
}: ExploreCardMenuProps) {
  const { t } = useTranslation('sets');
  const router = useRouter();
  const duplicateSet = useDuplicateSet(set.id);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${href}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success(t('actions.linkCopied')))
      .catch(() => undefined);
  };

  const handleCopySet = () => {
    if (audience === 'guest') {
      router.push('/login' as Route);
      return;
    }
    duplicateSet.mutate(undefined, {
      onSuccess: (copy) => {
        toast.success(t('actions.copied'));
        router.push(`/sets/${copy.id}` as Route);
      },
      onError: (err) => toast.error(formErrorMessage(err)),
    });
  };

  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('actions.more')}
            className="size-9 text-text-muted transition-colors duration-fast ease-standard hover:bg-surface hover:text-primary"
          >
            <MoreHorizontal aria-hidden className="size-5" />
          </Button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem asChild>
            <Link href={href}>
              <GraduationCap aria-hidden className="size-4" />
              <span>{t(audience === 'guest' ? 'grid.guestLabel' : 'actions.startStudy')}</span>
            </Link>
          </MenuItem>
          <MenuItem onSelect={handleCopySet} disabled={duplicateSet.isPending}>
            <Copy aria-hidden className="size-4" />
            <span>{t('actions.copyToLibrary')}</span>
          </MenuItem>
          <MenuSeparator />
          <MenuItem onSelect={handleCopyLink}>
            <Link2 aria-hidden className="size-4" />
            <span>{t('actions.copyLink')}</span>
          </MenuItem>
          {extraMenuItems}
        </MenuContent>
      </Menu>
      {extraDialogs}
    </>
  );
}
