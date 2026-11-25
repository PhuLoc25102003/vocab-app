'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdminSetItem, AdminSetStatus } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { DataTableContainer, DataTableHeader, DataTableRow } from '@/components/common/data-table';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ListNoMatch, ListPager, ListPanel, ListToolbar } from '@/components/common/list-panel';
import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { HttpError } from '@/lib/http';
import { cn } from '@/lib/utils';
import { adminKeys, ADMIN_SETS_PAGE_SIZE, listPublicSets, type AdminSetsView } from '../api';
import { HideSetButton } from './hide-set-button';

const STATUS_TABS = ['all', 'visible', 'hidden'] as const satisfies readonly AdminSetStatus[];

function setsHref(view: AdminSetsView): Route {
  const params = new URLSearchParams();
  if (view.q) params.set('q', view.q);
  if (view.status !== 'all') params.set('status', view.status);
  if (view.page > 1) params.set('page', String(view.page));
  const query = params.toString();
  return (query ? `/admin/hidden-sets?${query}` : '/admin/hidden-sets') as Route;
}

function readView(params: URLSearchParams): AdminSetsView {
  const q = params.get('q') ?? '';
  const statusParam = params.get('status');
  const status: AdminSetStatus =
    statusParam === 'visible' || statusParam === 'hidden' ? statusParam : 'all';
  const pageRaw = Number.parseInt(params.get('page') ?? '1', 10);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  return { q, status, page };
}

const SET_GRID =
  'minmax(200px, 1.8fr) minmax(180px, 1.4fr) minmax(140px, 1fr) minmax(140px, 1.1fr) minmax(110px, 0.9fr)';

function SetRow({ item }: { item: AdminSetItem }) {
  const { t, i18n } = useTranslation('admin');

  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
  const hiddenDate = item.hiddenAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(item.hiddenAt),
      )
    : null;
  const createdDate = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    new Date(item.createdAt),
  );

  const isHidden = Boolean(item.hiddenAt);

  return (
    <DataTableRow gridTemplateColumns={SET_GRID}>
      {/* Cột 1: Bộ từ */}
      <div className="flex flex-col gap-1 min-w-0">
        <Link
          href={`/sets/${item.id}` as Route}
          className="font-semibold text-primary hover:underline truncate block"
          title={item.title}
        >
          {item.title}
        </Link>
        <span className="rounded-sm bg-surface-elevated px-2 py-0.5 text-tiny text-text-muted whitespace-nowrap w-fit">
          {t('publicSets.cardsCount', { count: item.cardCount })}
        </span>
      </div>

      {/* Cột 2: Tác giả */}
      <div className="flex flex-col min-w-0">
        <span
          className="font-medium text-text text-small truncate block"
          title={item.owner.displayName}
        >
          {item.owner.displayName}
        </span>
        <span className="text-small text-text-muted truncate block" title={item.owner.email}>
          {item.owner.email}
        </span>
      </div>

      {/* Cột 3: Thời gian */}
      <div className="flex flex-col text-small text-text-muted min-w-0">
        <span className="tabular-nums whitespace-nowrap">
          {isHidden ? hiddenDate : createdDate}
        </span>
        {isHidden && item.hiddenBy ? (
          <span
            className="text-tiny text-text-muted truncate block"
            title={item.hiddenBy.displayName}
          >
            {t('publicSets.by')}: {item.hiddenBy.displayName}
          </span>
        ) : null}
      </div>

      {/* Cột 4: Trạng thái */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className={cn(
            'rounded-sm px-2 py-0.5 text-tiny font-medium w-fit whitespace-nowrap',
            isHidden ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success',
          )}
        >
          {isHidden ? t('publicSets.statusHidden') : t('publicSets.statusVisible')}
        </span>
        {isHidden && item.hiddenReason ? (
          <span className="text-tiny text-danger truncate block" title={item.hiddenReason}>
            {item.hiddenReason}
          </span>
        ) : null}
      </div>

      {/* Cột 5: Thao tác (căn phải) */}
      <div className="flex justify-end">
        <HideSetButton setId={item.id} hidden={isHidden} />
      </div>
    </DataTableRow>
  );
}

export function AdminHiddenSetsLoading() {
  const { t } = useTranslation('admin');
  return (
    <LoadingState label={t('publicSets.loading')}>
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </LoadingState>
  );
}

export function AdminHiddenSets() {
  const { t } = useTranslation('admin');
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = readView(new URLSearchParams(searchParams.toString()));
  const go = (patch: Partial<AdminSetsView>) =>
    router.push(setsHref({ ...view, page: 1, ...patch }));

  const sets = useQuery({
    queryKey: adminKeys.setList(view),
    queryFn: () => listPublicSets(view),
  });

  if (sets.isError && sets.error instanceof HttpError && sets.error.status === 403) {
    return <EmptyState title={t('users.forbidden')} description={t('users.forbiddenHint')} />;
  }

  const filtered = Boolean(view.q || view.status !== 'all');
  let body;
  if (sets.isPending) {
    body = <AdminHiddenSetsLoading />;
  } else if (sets.isError) {
    body = (
      <ErrorState
        title={t('publicSets.failed')}
        description={t('checkNetwork')}
        onRetry={() => void sets.refetch()}
      />
    );
  } else if (sets.data.data.length === 0) {
    body = filtered ? (
      <ListNoMatch
        text={view.q ? t('publicSets.noMatch', { q: view.q }) : t('publicSets.noFilterMatch')}
        clearHref={setsHref({ q: '', status: 'all', page: 1 })}
      />
    ) : (
      <EmptyState
        title={t('publicSets.emptyTitle')}
        description={t('publicSets.emptyDescription')}
      />
    );
  } else {
    body = (
      <DataTableContainer minWidth="min-w-[870px]">
        <DataTableHeader
          gridTemplateColumns={SET_GRID}
          columns={[
            { label: t('publicSets.thSet') },
            { label: t('publicSets.thOwner') },
            { label: t('publicSets.thDate') },
            { label: t('publicSets.thStatus') },
            { label: t('publicSets.thAction'), align: 'right' },
          ]}
        />
        <ul aria-label={t('publicSets.list')} className="flex flex-col">
          {sets.data.data.map((item) => (
            <SetRow key={item.id} item={item} />
          ))}
        </ul>
      </DataTableContainer>
    );
  }

  return (
    <ListPanel
      title={t('publicSets.title')}
      count={sets.data?.meta.total}
      toolbar={
        <ListToolbar
          key={`${view.q}-${view.status}`}
          tabs={STATUS_TABS.map((status) => ({
            label: t(`publicSets.status.${status}`),
            href: setsHref({ ...view, status, page: 1 }),
            current: view.status === status,
          }))}
          search={{
            label: t('publicSets.search'),
            value: view.q,
            onSearch: (q) => go({ q }),
          }}
        />
      }
      footer={
        sets.data && sets.data.meta.total > 0 ? (
          <ListPager
            page={sets.data.meta.page}
            pageSize={ADMIN_SETS_PAGE_SIZE}
            total={sets.data.meta.total}
            hrefFor={(page) => setsHref({ ...view, page })}
          />
        ) : null
      }
    >
      {body}
    </ListPanel>
  );
}

export const AdminPublicSets = AdminHiddenSets;
export const AdminPublicSetsLoading = AdminHiddenSetsLoading;
