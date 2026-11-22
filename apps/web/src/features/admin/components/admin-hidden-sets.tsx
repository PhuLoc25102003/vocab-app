'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminHiddenSetItem } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ListNoMatch, ListPager, ListPanel, ListToolbar } from '@/components/common/list-panel';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import {
  adminKeys,
  ADMIN_HIDDEN_SETS_PAGE_SIZE,
  listHiddenSets,
  unhideSet,
  type AdminHiddenSetsView,
} from '../api';

function hiddenSetsHref(view: AdminHiddenSetsView): Route {
  const params = new URLSearchParams();
  if (view.q) params.set('q', view.q);
  if (view.page > 1) params.set('page', String(view.page));
  const query = params.toString();
  return (query ? `/admin/hidden-sets?${query}` : '/admin/hidden-sets') as Route;
}

function readView(params: URLSearchParams): AdminHiddenSetsView {
  const q = params.get('q') ?? '';
  const pageRaw = Number.parseInt(params.get('page') ?? '1', 10);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  return { q, page };
}

function HiddenSetRow({ item }: { item: AdminHiddenSetItem }) {
  const { t, i18n } = useTranslation('admin');
  const queryClient = useQueryClient();

  const unhide = useMutation({
    mutationFn: () => unhideSet(item.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.hiddenSets }),
        queryClient.invalidateQueries({ queryKey: adminKeys.stats }),
      ]);
      toast.success(t('hiddenSets.unhideSuccess', { title: item.title }));
    },
    onError: (error) => toast.error(formErrorMessage(error)),
  });

  const hiddenDate = new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(item.hiddenAt));

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
            {t('hiddenSets.cardsCount', { count: item.cardCount })}
          </span>
        </div>

        <p className="text-small text-text-muted">
          {t('hiddenSets.owner')}:{' '}
          <span className="font-medium text-text">{item.owner.displayName}</span> (
          {item.owner.email})
        </p>

        {item.hiddenReason ? (
          <p className="text-small text-danger bg-danger-soft/40 px-2 py-1 rounded-sm wrap-anywhere">
            <span className="font-medium">{t('hiddenSets.reason')}:</span> {item.hiddenReason}
          </p>
        ) : null}

        <p className="text-tiny text-text-muted">
          {t('hiddenSets.hiddenAt')}: {hiddenDate}
          {item.hiddenBy ? ` • ${t('hiddenSets.by')}: ${item.hiddenBy.displayName}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="secondary"
          className="h-9 px-3 text-small"
          loading={unhide.isPending}
          onClick={() => unhide.mutate()}
        >
          {t('hiddenSets.unhide')}
        </Button>
      </div>
    </li>
  );
}

export function AdminHiddenSetsLoading() {
  const { t } = useTranslation('admin');
  return (
    <LoadingState label={t('hiddenSets.loading')}>
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
  const go = (patch: Partial<AdminHiddenSetsView>) =>
    router.push(hiddenSetsHref({ ...view, page: 1, ...patch }));

  const sets = useQuery({
    queryKey: adminKeys.hiddenSetList(view),
    queryFn: () => listHiddenSets(view),
  });

  if (sets.isError && sets.error instanceof HttpError && sets.error.status === 403) {
    return <EmptyState title={t('users.forbidden')} description={t('users.forbiddenHint')} />;
  }

  const filtered = Boolean(view.q);
  let body;
  if (sets.isPending) {
    body = <AdminHiddenSetsLoading />;
  } else if (sets.isError) {
    body = (
      <ErrorState
        title={t('hiddenSets.failed')}
        description={t('checkNetwork')}
        onRetry={() => void sets.refetch()}
      />
    );
  } else if (sets.data.data.length === 0) {
    body = filtered ? (
      <ListNoMatch
        text={t('hiddenSets.noMatch', { q: view.q })}
        clearHref={hiddenSetsHref({ q: '', page: 1 })}
      />
    ) : (
      <EmptyState
        title={t('hiddenSets.emptyTitle')}
        description={t('hiddenSets.emptyDescription')}
      />
    );
  } else {
    body = (
      <ul aria-label={t('hiddenSets.list')} className="flex flex-col">
        {sets.data.data.map((item) => (
          <HiddenSetRow key={item.id} item={item} />
        ))}
      </ul>
    );
  }

  return (
    <ListPanel
      title={t('hiddenSets.title')}
      count={sets.data?.meta.total}
      toolbar={
        <ListToolbar
          key={view.q}
          search={{
            label: t('hiddenSets.search'),
            value: view.q,
            onSearch: (q) => go({ q }),
          }}
        />
      }
      footer={
        sets.data && sets.data.meta.total > 0 ? (
          <ListPager
            page={sets.data.meta.page}
            pageSize={ADMIN_HIDDEN_SETS_PAGE_SIZE}
            total={sets.data.meta.total}
            hrefFor={(page) => hiddenSetsHref({ ...view, page })}
          />
        ) : null
      }
    >
      {body}
    </ListPanel>
  );
}
