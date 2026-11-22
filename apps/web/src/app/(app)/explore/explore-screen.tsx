'use client';

import type { Route } from 'next';
import type { PublicSetSummary } from '@vocab/shared';
import { EyeOff, Globe, Lock } from 'lucide-react';
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
import { useToggleVisibility } from '@/features/sets/components/toggle-visibility-button';

function ExploreCardContextMenuWrapper({ set, href }: { set: PublicSetSummary; href: Route }) {
  const { t } = useTranslation(['sets', 'admin']);
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.id === set.ownerId;
  const canModerate = user?.role === 'ADMIN' && !isOwner;
  const admin = useAdminHideSet(set.id);
  const toggleVisibility = useToggleVisibility(set);
  const isGoingPrivate = toggleVisibility.nextVisibility === 'PRIVATE';

  const extraItem = isOwner ? (
    <ContextMenuItem onSelect={toggleVisibility.toggle} disabled={toggleVisibility.isPending}>
      {isGoingPrivate ? (
        <Lock aria-hidden className="size-4" />
      ) : (
        <Globe aria-hidden className="size-4" />
      )}
      <span>{t(isGoingPrivate ? 'actions.makePrivate' : 'actions.makePublic')}</span>
    </ContextMenuItem>
  ) : canModerate ? (
    <ContextMenuItem
      danger
      onSelect={() => {
        setTimeout(admin.openHideDialog);
      }}
    >
      <EyeOff aria-hidden className="size-4" />
      <span>{t('admin:hide.hide')}</span>
    </ContextMenuItem>
  ) : null;

  return (
    <ExploreContextMenuContent
      set={set}
      href={href}
      extraMenuItems={extraItem}
      extraDialogs={canModerate ? admin.hideDialog : null}
    />
  );
}

function ExploreCardActionsDropdownWrapper({ set, href }: { set: PublicSetSummary; href: Route }) {
  const { t } = useTranslation(['sets', 'admin']);
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.id === set.ownerId;
  const canModerate = user?.role === 'ADMIN' && !isOwner;
  const admin = useAdminHideSet(set.id);
  const toggleVisibility = useToggleVisibility(set);
  const isGoingPrivate = toggleVisibility.nextVisibility === 'PRIVATE';

  const extraItem = isOwner ? (
    <MenuItem onSelect={toggleVisibility.toggle} disabled={toggleVisibility.isPending}>
      {isGoingPrivate ? (
        <Lock aria-hidden className="size-4" />
      ) : (
        <Globe aria-hidden className="size-4" />
      )}
      <span>{t(isGoingPrivate ? 'actions.makePrivate' : 'actions.makePublic')}</span>
    </MenuItem>
  ) : canModerate ? (
    <MenuItem
      danger
      onSelect={() => {
        setTimeout(admin.openHideDialog);
      }}
    >
      <EyeOff aria-hidden className="size-4" />
      <span>{t('admin:hide.hide')}</span>
    </MenuItem>
  ) : null;

  return (
    <ExploreCardActionsDropdown
      set={set}
      href={href}
      extraMenuItems={extraItem}
      extraDialogs={canModerate ? admin.hideDialog : null}
    />
  );
}

export function ExploreScreen() {
  const hrefFor = (id: string) => `/sets/${id}?from=explore` as Route;

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
