'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Class, ClassMember, ClassMemberListQuery } from '@vocab/shared';
import { AlertCircle, Award, CheckCircle2, Clock, X, type LucideIcon } from 'lucide-react';
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
import {
  DataTableContainer,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
} from '@/components/common/data-table';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { cn } from '@/lib/utils';
import { classKeys, listMemberResults, listMembers, MEMBERS_PAGE_SIZE, removeMember } from '../api';
import { formatDate, formatDateTime } from '../format';
import { StatusLabel, percent } from './status-label';
import { useTranslation } from 'react-i18next';

type MemberSort = ClassMemberListQuery['sort'];

const MEMBER_SORTS: readonly MemberSort[] = ['joinedAt', '-joinedAt', 'name', '-name'];

const score = (value: number | null, none: string) => (value === null ? none : `${value}%`);

function StatTile({
  label,
  value,
  tone,
  icon: Icon,
  iconBg,
}: {
  label: string;
  value: string;
  tone?: string;
  icon?: LucideIcon;
  iconBg?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border-strong bg-surface p-3.5 shadow-xs">
      <div className="flex items-center justify-between">
        <dt className="text-small font-medium text-text-muted">{label}</dt>
        {Icon ? (
          <span className={cn('p-1 rounded-md shrink-0', iconBg)}>
            <Icon className={cn('size-4', tone)} />
          </span>
        ) : null}
      </div>
      <dd className={cn('text-h2 font-bold tabular-nums', tone)}>{value}</dd>
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
      <Dialog
        open
        onRequestClose={onClose}
        labelledBy={titleId}
        layout="sheet"
        size="lg"
        className="sm:max-w-[760px]"
      >
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <span
                aria-hidden
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary text-h3"
              >
                {member.displayName.trim().charAt(0).toLocaleUpperCase('vi') || '?'}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <h2
                  id={titleId}
                  className="text-h2 font-bold text-text truncate"
                  title={member.displayName}
                >
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
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('common:actions.close')}
              className="-mr-2 shrink-0"
              onClick={onClose}
            >
              <X aria-hidden className="size-5" />
            </Button>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label={t('members.onTime')}
              value={`${stats.onTime}/${graded}`}
              tone="text-success"
              icon={CheckCircle2}
              iconBg="bg-success-soft"
            />
            <StatTile
              label={t('members.late')}
              value={String(stats.late)}
              tone="text-warning"
              icon={Clock}
              iconBg="bg-warning-soft"
            />
            <StatTile
              label={t('members.missed')}
              value={String(stats.missed)}
              tone="text-danger"
              icon={AlertCircle}
              iconBg="bg-danger-soft"
            />
            <StatTile
              label={t('members.average')}
              value={score(stats.averageScore, t('results.none'))}
              tone="text-primary"
              icon={Award}
              iconBg="bg-primary-soft"
            />
          </dl>

          <section
            aria-labelledby={`${titleId}-recent`}
            className="flex flex-col gap-3 rounded-lg border border-border-strong bg-surface p-4 shadow-xs"
          >
            <h3 id={`${titleId}-recent`} className="font-semibold text-text">
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
              <p className="py-2 text-text-muted">{t('members.noAssignments')}</p>
            ) : (
              <ul className="divide-y divide-border">
                {results.data.data.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    className="grid min-h-11 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 py-2.5 text-small sm:grid-cols-[1fr_auto_auto_auto]"
                  >
                    <span className="min-w-0 truncate font-medium text-text" title={item.setTitle}>
                      {item.setTitle}
                    </span>
                    <span className="text-text-muted sm:order-none">
                      {item.dueAt
                        ? t('members.dueDate', { date: formatDate(item.dueAt) })
                        : t('assignments.noDue')}
                    </span>
                    <StatusLabel status={item.status} />
                    <span className="text-right tabular-nums font-semibold text-text">
                      {item.correct !== null && item.total !== null
                        ? `${percent(item.correct, item.total)}%`
                        : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
            <Button variant="danger" onClick={() => setConfirming(true)}>
              {t('members.remove')}
            </Button>
            <Button asChild>
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

const MEMBER_GRID = 'minmax(200px, 1.8fr) 130px 100px 100px 100px 110px';

function MemberRow({ member, onOpen }: { member: ClassMember; onOpen: () => void }) {
  const { t } = useTranslation('classes');
  const { stats } = member;
  return (
    <DataTableRow
      as="li"
      gridTemplateColumns={MEMBER_GRID}
      className="relative items-center gap-4 py-3 hover:bg-primary-soft sm:px-3"
    >
      <DataTableCell className="flex min-w-0 flex-col">
        <button
          type="button"
          onClick={onOpen}
          title={member.displayName}
          className="flex min-h-11 min-w-0 items-center text-left font-medium text-primary hover:underline after:absolute after:inset-0"
        >
          <span className="truncate block" title={member.displayName}>
            {member.displayName}
          </span>
          <span className="sr-only">{t('members.openProfile')}</span>
        </button>
      </DataTableCell>

      <DataTableCell className="text-small text-text-muted">
        {formatDate(member.joinedAt)}
      </DataTableCell>

      <DataTableCell align="right" className="text-small tabular-nums font-semibold text-success">
        {stats.onTime}
      </DataTableCell>

      <DataTableCell align="right" className="text-small tabular-nums font-semibold text-warning">
        {stats.late}
      </DataTableCell>

      <DataTableCell align="right" className="text-small tabular-nums font-semibold text-danger">
        {stats.missed}
      </DataTableCell>

      <DataTableCell align="right" className="text-small tabular-nums font-semibold text-text">
        {score(stats.averageScore, t('results.none'))}
      </DataTableCell>
    </DataTableRow>
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
      <DataTableContainer minWidth="min-w-[720px]">
        <DataTableHeader
          gridTemplateColumns={MEMBER_GRID}
          columns={[
            { label: t('members.name') },
            { label: t('members.joined') },
            { label: t('members.onTime'), align: 'right' },
            { label: t('members.lateCol'), align: 'right' },
            { label: t('members.missed'), align: 'right' },
            { label: t('members.average'), align: 'right' },
          ]}
        />
        <ul aria-label={t('members.list')} className="flex flex-col">
          {data.map((member) => (
            <MemberRow key={member.userId} member={member} onOpen={() => setOpen(member)} />
          ))}
        </ul>
      </DataTableContainer>
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
