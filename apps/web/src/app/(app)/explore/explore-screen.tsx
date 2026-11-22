'use client';

import type { Route } from 'next';
import type { PublicSetSummary } from '@vocab/shared';
import { EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ContextMenuItem } from '@/components/ui/context-menu';
import { MenuItem } from '@/components/ui/menu';
import { useAdminHideSet } from '@/features/admin/hooks/use-admin-hide-set';
import { useAuthStore } from '@/features/auth/store';
import {
  ExploreCardActionsDropdown,
  ExploreContextMenuContent,
} from '@/features/sets/components/explore-card-menu';
import { ExploreSets } from '@/features/sets/components/explore-sets';

function ExploreCardContextMenuWrapper({ set, href }: { set: PublicSetSummary; href: Route }) {
  const { t } = useTranslation('admin');
  const user = useAuthStore((state) => state.user);
  const canModerate = user?.role === 'ADMIN';
  const admin = useAdminHideSet(set.id);

  return (
    <ExploreContextMenuContent
      set={set}
      href={href}
      extraMenuItems={
        canModerate ? (
          <ContextMenuItem
            danger
            onSelect={() => {
              setTimeout(admin.openHideDialog);
            }}
          >
            <EyeOff aria-hidden className="size-4" />
            <span>{t('hide.hide')}</span>
          </ContextMenuItem>
        ) : null
      }
      extraDialogs={canModerate ? admin.hideDialog : null}
    />
  );
}

function ExploreCardActionsDropdownWrapper({ set, href }: { set: PublicSetSummary; href: Route }) {
  const { t } = useTranslation('admin');
  const user = useAuthStore((state) => state.user);
  const canModerate = user?.role === 'ADMIN';
  const admin = useAdminHideSet(set.id);

  return (
    <ExploreCardActionsDropdown
      set={set}
      href={href}
      extraMenuItems={
        canModerate ? (
          <MenuItem
            danger
            onSelect={() => {
              setTimeout(admin.openHideDialog);
            }}
          >
            <EyeOff aria-hidden className="size-4" />
            <span>{t('hide.hide')}</span>
          </MenuItem>
        ) : null
      }
      extraDialogs={canModerate ? admin.hideDialog : null}
    />
  );
}

export function ExploreScreen() {
  const hrefFor = (id: string) => `/sets/${id}` as Route;

  return (
    <ExploreSets
      audience="member"
      renderActions={(set) => (
        <ExploreCardActionsDropdownWrapper set={set} href={hrefFor(set.id)} />
      )}
      renderContextMenu={(set) => (
        <ExploreCardContextMenuWrapper set={set} href={hrefFor(set.id)} />
      )}
    />
  );
}
