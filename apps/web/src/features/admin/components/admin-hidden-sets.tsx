'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdminSetItem, AdminSetStatus } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ListNoMatch, ListPager, ListPanel, ListToolbar } from '@/components/common/list-panel';
import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { HttpError } from '@/lib/http';
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
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border py-3 last:border-b-0 sm:px-2">
      <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/sets/${item.id}` as Route}
            className="font-semibold text-primary hover:underline wrap-anywhere"
          >
            {item.title}
          </Link>
          <span className="rounded-sm bg-surface-elevated px-2 py-0.5 text-tiny text-text-muted">
            {t('publicSets.cardsCount', { count: item.cardCount })}
          </span>
          {isHidden ? (
            <span className="rounded-sm bg-danger-soft px-2 py-0.5 text-tiny font-medium text-danger">
              {t('publicSets.statusHidden')}
            </span>
          ) : (
            <span className="rounded-sm bg-success-soft px-2 py-0.5 text-tiny font-medium text-success">
              {t('publicSets.statusVisible')}
            </span>
          )}
        </div>

        <p className="text-small text-text-muted">
          {t('publicSets.owner')}:{' '}
          <span className="font-medium text-text">{item.owner.displayName}</span> (
          {item.owner.email})
        </p>

        {isHidden && item.hiddenReason ? (
          <p className="text-small text-danger bg-danger-soft/40 px-2 py-1 rounded-sm wrap-anywhere">
            <span className="font-medium">{t('publicSets.reason')}:</span> {item.hiddenReason}
          </p>
        ) : null}

        <p className="text-tiny text-text-muted">
          {isHidden
            ? `${t('publicSets.hiddenAt')}: ${hiddenDate}${item.hiddenBy ? ` • ${t('publicSets.by')}: ${item.hiddenBy.displayName}` : ''}`
            : `${t('publicSets.createdAt')}: ${createdDate}`}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <HideSetButton setId={item.id} hidden={isHidden} />
      </div>
    </li>
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
      <ul aria-label={t('publicSets.list')} className="flex flex-col">
        {sets.data.data.map((item) => (
          <SetRow key={item.id} item={item} />
        ))}
      </ul>
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
