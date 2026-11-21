'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Class, ClassMember, ClassMemberListQuery } from '@vocab/shared';
import { X } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import {
  ListFilter,
  ListNoMatch,
  ListPager,
  ListPanel,
  ListToolbar,
} from '@/components/common/list-panel';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { classKeys, listMemberResults, listMembers, MEMBERS_PAGE_SIZE, removeMember } from '../api';
import { formatDate, formatDateTime } from '../format';
import { StatusLabel, percent } from './status-label';
import { useTranslation } from 'react-i18next';

type MemberSort = ClassMemberListQuery['sort'];

const MEMBER_SORTS: readonly MemberSort[] = ['joinedAt', '-joinedAt', 'name', '-name'];

const score = (value: number | null, none: string) => (value === null ? none : `${value}%`);

function StatTile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-border-strong bg-surface p-3">
      <dd className={`text-h3 tabular-nums ${tone ?? ''}`}>{value}</dd>
      <dt className="text-small text-text-muted">{label}</dt>
    </div>
  );
}

/** Modal hồ sơ học sinh: số liệu, 5 bài gần đây, xem tất cả và xoá khỏi lớp (việc 5.16c). */
function MemberProfile({
  classId,
  member,
  onClose,
}: {
  classId: string;
  member: ClassMember;
  onClose: () => void;
}) {
  const { t } = useTranslation(['classes', 'common']);
  const titleId = useId();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const results = useQuery({
    queryKey: classKeys.memberResults(classId, member.userId),
    queryFn: () => listMemberResults(classId, member.userId),
  });
  const remove = useMutation({
    mutationFn: () => removeMember(classId, member.userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classKeys.all }),
  });
  const { stats } = member;
  const graded = stats.onTime + stats.late + stats.missed;

  return (
    <>
      <Dialog open onRequestClose={onClose} labelledBy={titleId} layout="sheet" size="lg">
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 id={titleId} className="text-h3 wrap-anywhere">
                {member.displayName}
              </h2>
              <p className="text-small text-text-muted">
                {t('members.joinedActive', {
                  joined: formatDate(member.joinedAt),
                  active: stats.lastActiveAt
                    ? formatDateTime(stats.lastActiveAt)
                    : t('members.never'),
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('common:actions.close')}
              className="-mt-2 -mr-3 shrink-0"
              onClick={onClose}
            >
              <X aria-hidden className="size-5" />
            </Button>
          </div>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile
              label={t('members.onTime')}
              value={`${stats.onTime}/${graded}`}
              tone="text-success"
            />
            <StatTile label={t('members.late')} value={String(stats.late)} tone="text-warning" />
            <StatTile label={t('members.missed')} value={String(stats.missed)} tone="text-danger" />
            <StatTile
              label={t('members.average')}
              value={score(stats.averageScore, t('results.none'))}
            />
          </dl>
          <section aria-labelledby={`${titleId}-recent`} className="flex flex-col gap-2">
            <h3 id={`${titleId}-recent`} className="font-semibold">
              {t('members.recent')}
            </h3>
            {results.isPending ? (
              <LoadingState label={t('members.loadingRecent')}>
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </LoadingState>
            ) : results.isError ? (
              <ErrorState
                title={t('members.recentFailed')}
                description={t('checkNetwork')}
                onRetry={() => void results.refetch()}
              />
            ) : results.data.data.length === 0 ? (
              <p className="text-text-muted">{t('members.noAssignments')}</p>
            ) : (
              <ul className="border-t border-border">
                {results.data.data.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    className="grid min-h-11 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 border-b border-border py-2 text-small sm:grid-cols-[1fr_auto_auto_auto]"
                  >
                    <span className="min-w-0 truncate font-medium" title={item.setTitle}>
                      {item.setTitle}
                    </span>
                    <span className="text-text-muted sm:order-none">
                      {item.dueAt
                        ? t('members.dueDate', { date: formatDate(item.dueAt) })
                        : t('assignments.noDue')}
                    </span>
                    <StatusLabel status={item.status} />
                    <span className="text-right tabular-nums">
                      {item.correct !== null && item.total !== null
                        ? `${percent(item.correct, item.total)}%`
                        : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="danger" onClick={() => setConfirming(true)}>
              {t('members.remove')}
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/classes/${classId}/members/${member.userId}` as Route}>
                {t('members.seeAll')}
              </Link>
            </Button>
          </div>
        </div>
      </Dialog>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('members.removeTitle', { name: member.displayName })}
        description={t('members.removeDescription')}
        confirmLabel={t('members.remove')}
        pending={remove.isPending}
        error={remove.error ? formErrorMessage(remove.error) : null}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              setConfirming(false);
              onClose();
              toast.success(t('members.removed', { name: member.displayName }));
            },
          })
        }
      />
    </>
  );
}

function MemberRow({ member, onOpen }: { member: ClassMember; onOpen: () => void }) {
  const { t } = useTranslation('classes');
  const { stats } = member;
  return (
    <li className="relative grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b border-border py-2 last:border-b-0 hover:bg-primary-soft sm:grid-cols-[2fr_1fr_repeat(4,minmax(4rem,1fr))] sm:px-2">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-11 min-w-0 items-center text-left font-medium text-primary wrap-anywhere after:absolute after:inset-0"
      >
        {member.displayName}
        <span className="sr-only">{t('members.openProfile')}</span>
      </button>
      <span className="text-small text-text-muted sm:text-body">
        <span className="sm:hidden">{t('members.joinedShort')}</span>
        {formatDate(member.joinedAt)}
      </span>
      <span className="col-span-2 flex flex-wrap gap-x-3 text-small tabular-nums sm:contents sm:text-body">
        <span className="text-success sm:text-right">
          <span className="sm:hidden">{t('members.onTimeShort')}</span>
          {stats.onTime}
        </span>
        <span className="text-warning sm:text-right">
          <span className="sm:hidden">{t('members.lateShort')}</span>
          {stats.late}
        </span>
        <span className="text-danger sm:text-right">
          <span className="sm:hidden">{t('members.missedShort')}</span>
          {stats.missed}
        </span>
        <span className="sm:text-right">
          <span className="sm:hidden">{t('members.averageShort')}</span>
          {score(stats.averageScore, t('results.none'))}
        </span>
      </span>
    </li>
  );
}

export function ClassMembers({
  klass,
  page,
  query,
  sort,
  hrefFor,
  clearHref,
  onSearch,
}: {
  klass: Class;
  page: number;
  query: string;
  sort: MemberSort;
  hrefFor: (page: number) => Route;
  /** Bỏ tìm và sắp xếp, về trang 1 của tab Học sinh. */
  clearHref: Route;
  onSearch: (next: { q: string; sort: MemberSort }) => void;
}) {
  const { t } = useTranslation('classes');
  const [open, setOpen] = useState<ClassMember | null>(null);
  const members = useQuery({
    queryKey: classKeys.membersQuery(klass.id, page, query, sort),
    queryFn: () => listMembers(klass.id, page, { q: query, sort }),
  });

  let body;
  if (members.isPending) {
    body = (
      <LoadingState label={t('members.loading')}>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </LoadingState>
    );
  } else if (members.isError) {
    body = (
      <ErrorState
        title={t('members.failed')}
        description={t('checkNetwork')}
        onRetry={() => void members.refetch()}
      />
    );
  } else if (members.data.data.length === 0) {
    body = query ? (
      <ListNoMatch text={t('members.noMatch', { q: query })} clearHref={clearHref} />
    ) : (
      <EmptyState
        title={t('members.empty')}
        description={t('members.emptyHint', { code: klass.joinCode })}
      />
    );
  } else {
    const { data } = members.data;
    body = (
      <>
        <div
          aria-hidden
          className="hidden grid-cols-[2fr_1fr_repeat(4,minmax(4rem,1fr))] gap-x-4 border-b border-border px-2 pb-2 text-small font-medium text-text-muted sm:grid"
        >
          <span>{t('members.name')}</span>
          <span>{t('members.joined')}</span>
          <span className="text-right">{t('members.onTime')}</span>
          <span className="text-right">{t('members.lateCol')}</span>
          <span className="text-right">{t('members.missed')}</span>
          <span className="text-right">{t('members.average')}</span>
        </div>
        <ul aria-label={t('members.list')} className="flex flex-col">
          {data.map((member) => (
            <MemberRow key={member.userId} member={member} onOpen={() => setOpen(member)} />
          ))}
        </ul>
      </>
    );
  }

  return (
    <ListPanel
      title={t('members.title')}
      count={members.data?.meta.total}
      toolbar={
        <ListToolbar
          search={{
            label: t('members.search'),
            value: query,
            onSearch: (q) => onSearch({ q, sort }),
          }}
          filters={
            <ListFilter wide>
              <Select
                aria-label={t('members.sortLabel')}
                value={sort}
                onChange={(event) => onSearch({ q: query, sort: event.target.value as MemberSort })}
              >
                {MEMBER_SORTS.map((value) => (
                  <option key={value} value={value}>
                    {t(`members.sort.${value}`)}
                  </option>
                ))}
              </Select>
            </ListFilter>
          }
        />
      }
      footer={
        members.data && members.data.meta.total > 0 ? (
          <ListPager
            page={members.data.meta.page}
            pageSize={MEMBERS_PAGE_SIZE}
            total={members.data.meta.total}
            hrefFor={hrefFor}
          />
        ) : null
      }
    >
      {body}
      {open ? (
        <MemberProfile classId={klass.id} member={open} onClose={() => setOpen(null)} />
      ) : null}
    </ListPanel>
  );
}
