'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminClassItem, AdminTeacherItem, AdminUnassignedStudent } from '@vocab/shared';
import { ChevronDown, School, UserCheck, UserMinus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ListNoMatch, ListPanel } from '@/components/common/list-panel';
import { LoadingState } from '@/components/common/loading-state';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import { cn } from '@/lib/utils';
import { adminKeys, getAdminClassesOverview, unlockUser } from '../api';
import { LockDialog } from './lock-dialog';

const TEACHERS_PAGE_SIZE = 5;
const UNASSIGNED_PAGE_SIZE = 10;
type UnassignedStatusTab = 'all' | 'active' | 'locked';

function StatTile({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
}: {
  label: string;
  value: number;
  icon: typeof School;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-lg border border-border-strong bg-surface p-4 shadow-sm">
      <span
        aria-hidden
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-lg',
          bgClass,
          colorClass,
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col">
        <span className="text-small text-text-muted">{label}</span>
        <span className="text-h2 font-bold tabular-nums text-text">{value}</span>
      </div>
    </div>
  );
}

function TeacherClassRow({ item }: { item: AdminClassItem }) {
  const { t, i18n } = useTranslation('admin');
  const [studentsExpanded, setStudentsExpanded] = useState(false);

  return (
    <div className="rounded-md border border-border bg-surface-elevated/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-1 basis-64 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-text wrap-anywhere">{item.name}</span>
            <span className="rounded-sm bg-primary-soft px-2 py-0.5 text-tiny font-medium text-primary">
              {t('classes.code')}: {item.joinCode}
            </span>
            {item.archivedAt ? (
              <span className="rounded-sm bg-border px-2 py-0.5 text-tiny text-text-muted">
                {t('classes.archived')}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 text-tiny text-text-muted">
            <span>{t('classes.membersCount', { count: item.memberCount })}</span>
            <span>•</span>
            <span>{t('classes.assignmentsCount', { count: item.assignmentCount })}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          className="gap-1.5 text-small text-primary"
          onClick={() => setStudentsExpanded((prev) => !prev)}
          aria-expanded={studentsExpanded}
        >
          <span>
            {studentsExpanded
              ? t('classes.hideStudents')
              : t('classes.viewStudents', { count: item.memberCount })}
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              'size-4 transition-transform duration-fast',
              studentsExpanded && 'rotate-180',
            )}
          />
        </Button>
      </div>

      {studentsExpanded ? (
        <div className="mt-3 rounded-md border border-border bg-surface-elevated/40 p-3">
          <h5 className="mb-2 text-tiny font-semibold uppercase tracking-wider text-text-muted">
            {t('classes.studentList')} ({item.members.length})
          </h5>
          {item.members.length === 0 ? (
            <p className="text-small text-text-muted">{t('classes.noStudents')}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {item.members.map((member) => {
                const joinedDate = new Intl.DateTimeFormat(
                  i18n.language === 'en' ? 'en-US' : 'vi-VN',
                  { dateStyle: 'short' },
                ).format(new Date(member.joinedAt));
                return (
                  <li
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-small"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-success shrink-0" />
                      <span className="font-medium text-text">{member.displayName}</span>
                      <span className="text-text-muted">({member.email})</span>
                    </div>
                    <span className="text-tiny text-text-muted">
                      {t('classes.joinedAt', { date: joinedDate })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function TeacherRow({ teacher }: { teacher: AdminTeacherItem }) {
  const { t } = useTranslation('admin');
  const [expanded, setExpanded] = useState(false);
  const initial = teacher.displayName.trim().charAt(0).toLocaleUpperCase('vi') || '?';

  return (
    <li className="flex flex-col border-b border-border py-4 last:border-b-0 sm:px-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary font-bold text-body"
          >
            {initial}
          </span>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-text text-body">{teacher.displayName}</span>
              <span className="rounded-sm bg-primary-soft/60 px-2 py-0.5 text-tiny font-medium text-primary">
                {t('classes.classesCount', { count: teacher.classCount })}
              </span>
              <span className="rounded-sm bg-surface-elevated px-2 py-0.5 text-tiny text-text-muted">
                {t('classes.membersCount', { count: teacher.totalStudents })}
              </span>
            </div>
            <span className="text-small text-text-muted">{teacher.email}</span>
          </div>
        </div>

        <Button
          variant="secondary"
          className="gap-1.5 text-small"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          <span>
            {expanded
              ? t('classes.hideClasses')
              : t('classes.viewClasses', { count: teacher.classCount })}
          </span>
          <ChevronDown
            aria-hidden
            className={cn('size-4 transition-transform duration-fast', expanded && 'rotate-180')}
          />
        </Button>
      </div>

      {expanded ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-surface p-3.5">
          {teacher.classes.length === 0 ? (
            <p className="text-small text-text-muted py-2">{t('classes.noClassesForTeacher')}</p>
          ) : (
            teacher.classes.map((c) => <TeacherClassRow key={c.id} item={c} />)
          )}
        </div>
      ) : null}
    </li>
  );
}

function UnassignedStudentRow({
  student,
  onLockClick,
  onUnlockSuccess,
}: {
  student: AdminUnassignedStudent;
  onLockClick: (student: AdminUnassignedStudent) => void;
  onUnlockSuccess: () => void;
}) {
  const { t, i18n } = useTranslation('admin');
  const queryClient = useQueryClient();
  const initial = student.displayName.trim().charAt(0).toLocaleUpperCase('vi') || '?';
  const isLocked = Boolean(student.lockedAt);

  const createdDate = new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'vi-VN', {
    dateStyle: 'medium',
  }).format(new Date(student.createdAt));

  const unlock = useMutation({
    mutationFn: () => unlockUser(student.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.classesOverview }),
        queryClient.invalidateQueries({ queryKey: adminKeys.users }),
        queryClient.invalidateQueries({ queryKey: adminKeys.stats }),
      ]);
      toast.success(t('classes.unlockSuccess'));
      onUnlockSuccess();
    },
    onError: (error) => toast.error(formErrorMessage(error)),
  });

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-1 sm:px-2">
      <div className="flex items-center gap-3 min-w-0 flex-1 basis-64">
        <span
          aria-hidden
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full font-semibold text-small',
            isLocked ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning',
          )}
        >
          {initial}
        </span>
        <div className="flex flex-col min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-text wrap-anywhere">{student.displayName}</span>
            {isLocked ? (
              <span className="rounded-sm bg-danger-soft px-2 py-0.5 text-tiny font-medium text-danger">
                {t('locked')}
              </span>
            ) : (
              <span className="rounded-sm bg-success-soft px-2 py-0.5 text-tiny font-medium text-success">
                {t('active')}
              </span>
            )}
          </div>
          <span className="text-small text-text-muted truncate">{student.email}</span>
          {isLocked && student.lockReason ? (
            <span className="text-tiny text-danger wrap-anywhere">
              {t('lockedReason', { reason: student.lockReason })}
            </span>
          ) : null}
          <span className="text-tiny text-text-muted mt-0.5">
            {t('classes.registeredAt', { date: createdDate })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isLocked ? (
          <Button
            variant="secondary"
            className="h-9 px-3 text-small"
            loading={unlock.isPending}
            onClick={() => unlock.mutate()}
          >
            {t('classes.unlockStudent')}
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="h-9 px-3 text-small"
            onClick={() => onLockClick(student)}
          >
            {t('classes.lockStudent')}
          </Button>
        )}
      </div>
    </li>
  );
}

export function AdminClassesLoading() {
  const { t } = useTranslation('admin');
  return (
    <LoadingState label={t('classes.loading')}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="mt-4 h-64 w-full" />
    </LoadingState>
  );
}

export function AdminClasses() {
  const { t } = useTranslation('admin');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [teacherPage, setTeacherPage] = useState(1);

  const [unassignedFilter, setUnassignedFilter] = useState('');
  const [unassignedStatus, setUnassignedStatus] = useState<UnassignedStatusTab>('all');
  const [unassignedPage, setUnassignedPage] = useState(1);

  const [lockTarget, setLockTarget] = useState<AdminUnassignedStudent | null>(null);

  const overview = useQuery({
    queryKey: adminKeys.classesOverview,
    queryFn: getAdminClassesOverview,
  });

  if (overview.isError && overview.error instanceof HttpError && overview.error.status === 403) {
    return <EmptyState title={t('users.forbidden')} description={t('users.forbiddenHint')} />;
  }

  if (overview.isPending) {
    return <AdminClassesLoading />;
  }

  if (overview.isError) {
    return (
      <ErrorState
        title={t('classes.failed')}
        description={t('checkNetwork')}
        onRetry={() => void overview.refetch()}
      />
    );
  }

  const data = overview.data;
  const teachers = data.teachers ?? [];

  // Lọc danh sách giáo viên
  const qTeacher = teacherFilter.trim().toLowerCase();
  const filteredTeachers = teachers.filter((teacher) => {
    if (!qTeacher) return true;
    const matchTeacher =
      teacher.displayName.toLowerCase().includes(qTeacher) ||
      teacher.email.toLowerCase().includes(qTeacher);
    const matchClasses = teacher.classes.some(
      (c) =>
        c.name.toLowerCase().includes(qTeacher) ||
        c.joinCode.toLowerCase().includes(qTeacher) ||
        c.members.some(
          (m) =>
            m.displayName.toLowerCase().includes(qTeacher) ||
            m.email.toLowerCase().includes(qTeacher),
        ),
    );
    return matchTeacher || matchClasses;
  });

  const teacherPageCount = Math.max(1, Math.ceil(filteredTeachers.length / TEACHERS_PAGE_SIZE));
  const currentTeacherPage = Math.min(teacherPage, teacherPageCount);
  const pagedTeachers = filteredTeachers.slice(
    (currentTeacherPage - 1) * TEACHERS_PAGE_SIZE,
    currentTeacherPage * TEACHERS_PAGE_SIZE,
  );

  // Lọc danh sách học sinh chưa có lớp
  const qUnassigned = unassignedFilter.trim().toLowerCase();
  const filteredUnassigned = data.unassignedStudents.filter((student) => {
    if (unassignedStatus === 'active' && student.lockedAt) return false;
    if (unassignedStatus === 'locked' && !student.lockedAt) return false;
    if (!qUnassigned) return true;
    return (
      student.displayName.toLowerCase().includes(qUnassigned) ||
      student.email.toLowerCase().includes(qUnassigned)
    );
  });

  const unassignedPageCount = Math.max(
    1,
    Math.ceil(filteredUnassigned.length / UNASSIGNED_PAGE_SIZE),
  );
  const currentUnassignedPage = Math.min(unassignedPage, unassignedPageCount);
  const pagedUnassigned = filteredUnassigned.slice(
    (currentUnassignedPage - 1) * UNASSIGNED_PAGE_SIZE,
    currentUnassignedPage * UNASSIGNED_PAGE_SIZE,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 3 Thẻ thống kê tổng quan */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label={t('classes.totalClasses')}
          value={data.totalClasses}
          icon={School}
          colorClass="text-primary"
          bgClass="bg-primary-soft"
        />
        <StatTile
          label={t('classes.totalStudentsInClasses')}
          value={data.totalStudentsInClasses}
          icon={UserCheck}
          colorClass="text-success"
          bgClass="bg-success-soft"
        />
        <StatTile
          label={t('classes.totalUnassignedStudents')}
          value={data.totalUnassignedStudents}
          icon={UserMinus}
          colorClass="text-warning"
          bgClass="bg-warning-soft"
        />
      </div>

      {/* Bảng danh sách giáo viên & lớp học */}
      <ListPanel
        title={t('classes.byTeacherTitle')}
        count={teachers.length}
        toolbar={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="search"
              placeholder={t('classes.searchTeacherPlaceholder')}
              value={teacherFilter}
              onChange={(e) => {
                setTeacherFilter(e.target.value);
                setTeacherPage(1);
              }}
              className="max-w-md"
            />
          </div>
        }
        footer={
          filteredTeachers.length > TEACHERS_PAGE_SIZE ? (
            <Pagination
              page={currentTeacherPage}
              pageCount={teacherPageCount}
              onPageChange={setTeacherPage}
            />
          ) : null
        }
      >
        {filteredTeachers.length === 0 ? (
          teacherFilter ? (
            <ListNoMatch
              text={t('classes.noTeacherMatch')}
              onClear={() => {
                setTeacherFilter('');
                setTeacherPage(1);
              }}
            />
          ) : (
            <EmptyState
              title={t('classes.emptyTeachersTitle')}
              description={t('classes.emptyTeachersDesc')}
            />
          )
        ) : (
          <ul aria-label={t('classes.byTeacherTitle')} className="flex flex-col">
            {pagedTeachers.map((teacher) => (
              <TeacherRow key={teacher.id} teacher={teacher} />
            ))}
          </ul>
        )}
      </ListPanel>

      {/* Bảng danh sách học sinh chưa có lớp học */}
      <ListPanel
        title={t('classes.unassignedTitle')}
        count={data.unassignedStudents.length}
        toolbar={
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2">
              {(['all', 'active', 'locked'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setUnassignedStatus(tab);
                    setUnassignedPage(1);
                  }}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-small font-medium transition-colors',
                    unassignedStatus === tab
                      ? 'bg-primary text-primary-fg shadow-sm'
                      : 'text-text-muted hover:bg-surface-elevated hover:text-text',
                  )}
                >
                  {t(`classes.status.${tab}`)}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Input
                type="search"
                placeholder={t('classes.searchUnassignedPlaceholder')}
                value={unassignedFilter}
                onChange={(e) => {
                  setUnassignedFilter(e.target.value);
                  setUnassignedPage(1);
                }}
                className="max-w-md"
              />
            </div>
          </div>
        }
        footer={
          filteredUnassigned.length > UNASSIGNED_PAGE_SIZE ? (
            <Pagination
              page={currentUnassignedPage}
              pageCount={unassignedPageCount}
              onPageChange={setUnassignedPage}
            />
          ) : null
        }
      >
        {filteredUnassigned.length === 0 ? (
          unassignedFilter || unassignedStatus !== 'all' ? (
            <ListNoMatch
              text={t('classes.noUnassignedMatch')}
              onClear={() => {
                setUnassignedFilter('');
                setUnassignedStatus('all');
                setUnassignedPage(1);
              }}
            />
          ) : (
            <EmptyState
              title={t('classes.emptyUnassignedTitle')}
              description={t('classes.emptyUnassignedDesc')}
            />
          )
        ) : (
          <ul
            aria-label={t('classes.unassignedTitle')}
            className="flex flex-col divide-y divide-border"
          >
            {pagedUnassigned.map((student) => (
              <UnassignedStudentRow
                key={student.id}
                student={student}
                onLockClick={(s) => setLockTarget(s)}
                onUnlockSuccess={() => void overview.refetch()}
              />
            ))}
          </ul>
        )}
      </ListPanel>

      {/* Dialog khoá tài khoản học sinh */}
      {lockTarget ? (
        <LockDialog
          user={{
            id: lockTarget.id,
            email: lockTarget.email,
            displayName: lockTarget.displayName,
          }}
          open={Boolean(lockTarget)}
          defaultReason={t('classes.lockReasonDefault')}
          onOpenChange={(open) => {
            if (!open) setLockTarget(null);
          }}
          onSuccess={() => {
            setLockTarget(null);
            void overview.refetch();
          }}
        />
      ) : null}
    </div>
  );
}
