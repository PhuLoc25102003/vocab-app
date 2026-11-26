'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminClassItem, AdminTeacherItem, AdminUnassignedStudent } from '@vocab/shared';
import {
  ChevronDown,
  Lock,
  School,
  Search,
  Unlock,
  UserCheck,
  UserMinus,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { DataTableContainer, DataTableHeader, DataTableRow } from '@/components/common/data-table';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ListNoMatch, ListPager, ListPanel } from '@/components/common/list-panel';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import { GlassTabGroup, GlassTabIndicator } from '@/components/ui/glass-tabs';
import { cn } from '@/lib/utils';
import { adminKeys, getAdminClassesOverview, unlockUser } from '../api';
import { LockDialog } from './lock-dialog';

const TEACHERS_PAGE_SIZE = 5;
const UNASSIGNED_PAGE_SIZE = 10;

const TEACHER_GRID =
  'minmax(220px, 2fr) minmax(110px, 1fr) minmax(130px, 1fr) minmax(165px, 1.2fr)';
const CLASS_GRID =
  'minmax(170px, 1.8fr) minmax(120px, 1fr) minmax(110px, 0.9fr) minmax(130px, 1fr) minmax(120px, 0.9fr) minmax(175px, 1.3fr)';
const CLASS_STUDENT_GRID = 'minmax(180px, 1.5fr) minmax(200px, 1.8fr) minmax(150px, 1fr)';
const UNASSIGNED_GRID =
  'minmax(170px, 1.4fr) minmax(190px, 1.6fr) minmax(130px, 1fr) minmax(140px, 1.1fr) minmax(110px, 0.9fr)';

type TeacherFilterTab = 'all' | 'has_classes' | 'no_classes';
type TeacherSortOption = 'name_asc' | 'most_classes' | 'most_students' | 'newest';

type UnassignedStatusTab = 'all' | 'active' | 'locked';
type UnassignedSortOption = 'newest' | 'oldest' | 'name_asc' | 'email_asc';

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
    <div className="glass-surface flex h-full min-w-0 flex-col justify-between gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-start sm:gap-3.5 sm:p-4">
      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
        <span
          aria-hidden
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-11',
            bgClass,
            colorClass,
          )}
        >
          <Icon className="size-4 sm:size-5" />
        </span>
        <span className="text-h3 font-bold tabular-nums text-text sm:hidden">{value}</span>
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-tiny leading-tight text-text-muted break-words sm:text-small">
          {label}
        </span>
        <span className="hidden text-h2 font-bold tabular-nums text-text sm:block">{value}</span>
      </div>
    </div>
  );
}

function TeacherClassRow({ item }: { item: AdminClassItem }) {
  const { t, i18n } = useTranslation('admin');
  const [studentsExpanded, setStudentsExpanded] = useState(false);

  return (
    <div className="rounded-md border border-border bg-surface-elevated/20 p-3">
      <div style={{ gridTemplateColumns: CLASS_GRID }} className="grid items-center gap-4">
        {/* Tên lớp */}
        <div className="min-w-0">
          <span className="font-semibold text-text text-body truncate block" title={item.name}>
            {item.name}
          </span>
          {item.description ? (
            <p className="text-small text-text-muted truncate block" title={item.description}>
              {item.description}
            </p>
          ) : null}
        </div>

        {/* Mã tham gia */}
        <div>
          <span className="rounded-sm bg-primary-soft px-2 py-0.5 font-mono text-tiny font-medium text-primary whitespace-nowrap inline-block">
            {t('classes.code')}: {item.joinCode}
          </span>
        </div>

        {/* Số học sinh */}
        <div className="text-small text-text-muted text-center tabular-nums whitespace-nowrap">
          {t('classes.membersCount', { count: item.memberCount })}
        </div>

        {/* Số bài tập */}
        <div className="text-small text-text-muted text-center tabular-nums whitespace-nowrap">
          {t('classes.assignmentsCount', { count: item.assignmentCount })}
        </div>

        {/* Trạng thái */}
        <div className="text-center">
          {item.archivedAt ? (
            <span className="rounded-sm bg-border px-2 py-0.5 text-tiny text-text-muted whitespace-nowrap inline-block">
              {t('classes.archived')}
            </span>
          ) : (
            <span className="rounded-sm bg-success-soft px-2 py-0.5 text-tiny font-medium text-success whitespace-nowrap inline-block">
              {t('active')}
            </span>
          )}
        </div>

        {/* Action: Xem học sinh */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            className="gap-1.5 text-small text-primary whitespace-nowrap h-9 px-2.5"
            onClick={() => setStudentsExpanded((prev) => !prev)}
            aria-expanded={studentsExpanded}
          >
            <Users aria-hidden className="size-4 shrink-0" />
            <span>
              {studentsExpanded
                ? t('classes.hideStudents')
                : t('classes.viewStudents', { count: item.memberCount })}
            </span>
            <ChevronDown
              aria-hidden
              className={cn(
                'size-4 transition-transform duration-fast shrink-0',
                studentsExpanded && 'rotate-180',
              )}
            />
          </Button>
        </div>
      </div>

      {/* Danh sách học sinh bên trong lớp */}
      {studentsExpanded ? (
        <div className="mt-3 rounded-md border border-border bg-surface-elevated/40 p-3">
          <h5 className="mb-2 text-tiny font-semibold uppercase tracking-wider text-text-muted">
            {t('classes.studentList')} ({item.members.length})
          </h5>
          {item.members.length === 0 ? (
            <p className="py-1 text-small text-text-muted">{t('classes.noStudents')}</p>
          ) : (
            <DataTableContainer minWidth="min-w-[600px]">
              <DataTableHeader
                gridTemplateColumns={CLASS_STUDENT_GRID}
                columns={[
                  { label: t('classes.thStudent') },
                  { label: t('classes.thEmail') },
                  { label: t('classes.thJoinedAt'), align: 'right' },
                ]}
              />
              <div className="flex flex-col divide-y divide-border">
                {item.members.map((member) => {
                  const initial =
                    member.displayName.trim().charAt(0).toLocaleUpperCase('vi') || '?';
                  const joinedDate = new Intl.DateTimeFormat(
                    i18n.language === 'en' ? 'en-US' : 'vi-VN',
                    { dateStyle: 'short' },
                  ).format(new Date(member.joinedAt));
                  return (
                    <div
                      key={member.id}
                      style={{ gridTemplateColumns: CLASS_STUDENT_GRID }}
                      className="grid items-center gap-3 py-2 text-small"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          aria-hidden
                          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-tiny font-semibold text-primary"
                        >
                          {initial}
                        </span>
                        <span
                          className="font-medium text-text truncate block min-w-0"
                          title={member.displayName}
                        >
                          {member.displayName}
                        </span>
                      </div>
                      <span className="text-text-muted truncate block min-w-0" title={member.email}>
                        {member.email}
                      </span>
                      <span className="text-tiny text-text-muted text-right whitespace-nowrap">
                        {t('classes.joinedAt', { date: joinedDate })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </DataTableContainer>
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
    <li className="flex flex-col border-b border-border py-3 last:border-b-0 px-3 hover:bg-surface-elevated/20 transition-colors">
      <div style={{ gridTemplateColumns: TEACHER_GRID }} className="grid items-center gap-4">
        {/* Cột 1: Thông tin Giáo viên */}
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-body font-bold text-primary"
          >
            {initial}
          </span>
          <div className="flex flex-col min-w-0">
            <span
              className="font-semibold text-text text-body truncate block"
              title={teacher.displayName}
            >
              {teacher.displayName}
            </span>
            <span className="text-small text-text-muted truncate block" title={teacher.email}>
              {teacher.email}
            </span>
          </div>
        </div>

        {/* Cột 2: Số lớp học */}
        <div className="text-small text-center whitespace-nowrap">
          <span className="rounded-sm bg-primary-soft/60 px-2.5 py-1 text-tiny font-medium text-primary tabular-nums inline-block">
            {t('classes.classesCount', { count: teacher.classCount })}
          </span>
        </div>

        {/* Cột 3: Tổng học sinh */}
        <div className="text-small text-center whitespace-nowrap">
          <span className="rounded-sm bg-surface-elevated px-2.5 py-1 text-tiny font-medium text-text-muted tabular-nums inline-block">
            {t('classes.membersCount', { count: teacher.totalStudents })}
          </span>
        </div>

        {/* Cột 4 (Action): Thao tác mở rộng */}
        <div className="flex justify-end">
          <Button
            variant="secondary"
            className="w-full gap-1.5 text-small whitespace-nowrap h-9 px-3"
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
              className={cn(
                'size-4 transition-transform duration-fast shrink-0',
                expanded && 'rotate-180',
              )}
            />
          </Button>
        </div>
      </div>

      {/* Danh sách lớp học dạng bảng con khi bấm mở rộng */}
      {expanded ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-surface p-3.5">
          {teacher.classes.length === 0 ? (
            <p className="py-2 text-small text-text-muted">{t('classes.noClassesForTeacher')}</p>
          ) : (
            <DataTableContainer minWidth="min-w-[960px]">
              <DataTableHeader
                gridTemplateColumns={CLASS_GRID}
                columns={[
                  { label: t('classes.thClassName') },
                  { label: t('classes.thJoinCode') },
                  { label: t('classes.thMembers'), align: 'center' },
                  { label: t('classes.thAssignments'), align: 'center' },
                  { label: t('classes.thStatus'), align: 'center' },
                  { label: t('classes.thAction'), align: 'right' },
                ]}
              />
              <div className="flex flex-col gap-2 pt-2">
                {teacher.classes.map((c) => (
                  <TeacherClassRow key={c.id} item={c} />
                ))}
              </div>
            </DataTableContainer>
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
      toast.success(t('unlocked', { email: student.email }));
      onUnlockSuccess();
    },
    onError: (error) => toast.error(formErrorMessage(error)),
  });

  return (
    <DataTableRow gridTemplateColumns={UNASSIGNED_GRID}>
      {/* Cột 1: Học sinh (Avatar + Tên) */}
      <div className="flex items-center gap-3 min-w-0">
        <span
          aria-hidden
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full font-semibold',
            isLocked ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary',
          )}
        >
          {initial}
        </span>
        <span
          className="font-semibold text-text text-body truncate block min-w-0"
          title={student.displayName}
        >
          {student.displayName}
        </span>
      </div>

      {/* Cột 2: Email */}
      <div className="text-small text-text-muted min-w-0">
        <span className="truncate block" title={student.email}>
          {student.email}
        </span>
      </div>

      {/* Cột 3: Ngày đăng ký */}
      <div className="text-small text-text-muted tabular-nums whitespace-nowrap">{createdDate}</div>

      {/* Cột 4: Trạng thái (đồng bộ phong cách với trang Người dùng) */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-tiny font-medium w-fit whitespace-nowrap',
            isLocked ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success',
          )}
        >
          <span aria-hidden className="size-1.5 rounded-full bg-current" />
          {isLocked ? t('locked') : t('active')}
        </span>
        {isLocked && student.lockReason ? (
          <span
            className="text-tiny text-danger truncate block max-w-xs"
            title={student.lockReason}
          >
            {t('lockedReason', { reason: student.lockReason })}
          </span>
        ) : null}
      </div>

      {/* Cột 5 (Action): Thao tác Khoá / Mở khoá (đồng bộ với trang Người dùng) */}
      <div className="flex justify-end">
        {isLocked ? (
          <Button
            variant="secondary"
            className="gap-1.5 text-small whitespace-nowrap h-9 px-3"
            loading={unlock.isPending}
            onClick={() => unlock.mutate()}
          >
            <Unlock aria-hidden className="size-4 shrink-0 text-success" />
            {t('unlock')}
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="gap-1.5 text-small whitespace-nowrap h-9 px-3"
            onClick={() => onLockClick(student)}
          >
            <Lock aria-hidden className="size-4 shrink-0 text-danger" />
            {t('lock.button')}
          </Button>
        )}
      </div>
    </DataTableRow>
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

  // Bộ lọc bảng Giáo viên
  const [teacherFilter, setTeacherFilter] = useState('');
  const [teacherStatusTab, setTeacherStatusTab] = useState<TeacherFilterTab>('all');
  const [teacherSort, setTeacherSort] = useState<TeacherSortOption>('name_asc');
  const [teacherPage, setTeacherPage] = useState(1);

  // Bộ lọc bảng Học sinh chưa có lớp
  const [unassignedFilter, setUnassignedFilter] = useState('');
  const [unassignedStatus, setUnassignedStatus] = useState<UnassignedStatusTab>('all');
  const [unassignedSort, setUnassignedSort] = useState<UnassignedSortOption>('newest');
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

  // Lọc và sắp xếp danh sách giáo viên
  const qTeacher = teacherFilter.trim().toLowerCase();
  const filteredTeachers = teachers
    .filter((teacher) => {
      // Lọc theo tab trạng thái lớp
      if (teacherStatusTab === 'has_classes' && teacher.classCount === 0) return false;
      if (teacherStatusTab === 'no_classes' && teacher.classCount > 0) return false;

      // Tìm kiếm từ khoá ngập khung
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
    })
    .sort((a, b) => {
      if (teacherSort === 'most_classes') return b.classCount - a.classCount;
      if (teacherSort === 'most_students') return b.totalStudents - a.totalStudents;
      if (teacherSort === 'newest')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return a.displayName.localeCompare(b.displayName, 'vi');
    });

  const teacherPageCount = Math.max(1, Math.ceil(filteredTeachers.length / TEACHERS_PAGE_SIZE));
  const currentTeacherPage = Math.min(teacherPage, teacherPageCount);
  const pagedTeachers = filteredTeachers.slice(
    (currentTeacherPage - 1) * TEACHERS_PAGE_SIZE,
    currentTeacherPage * TEACHERS_PAGE_SIZE,
  );

  // Lọc và sắp xếp danh sách học sinh chưa có lớp
  const qUnassigned = unassignedFilter.trim().toLowerCase();
  const filteredUnassigned = data.unassignedStudents
    .filter((student) => {
      // Lọc theo tab trạng thái
      if (unassignedStatus === 'active' && student.lockedAt) return false;
      if (unassignedStatus === 'locked' && !student.lockedAt) return false;

      // Tìm kiếm từ khoá ngập khung
      if (!qUnassigned) return true;
      return (
        student.displayName.toLowerCase().includes(qUnassigned) ||
        student.email.toLowerCase().includes(qUnassigned)
      );
    })
    .sort((a, b) => {
      if (unassignedSort === 'oldest')
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (unassignedSort === 'name_asc') return a.displayName.localeCompare(b.displayName, 'vi');
      if (unassignedSort === 'email_asc') return a.email.localeCompare(b.email);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
          colorClass="text-danger"
          bgClass="bg-danger-soft"
        />
      </div>

      {/* Bảng danh sách giáo viên & lớp học */}
      <ListPanel
        title={t('classes.byTeacherTitle')}
        count={teachers.length}
        toolbar={
          <div className="flex flex-col gap-3">
            {/* Tabs lọc trạng thái lớp */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-border pb-2 sm:flex-wrap">
              <GlassTabGroup>
                {(['all', 'has_classes', 'no_classes'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    aria-pressed={teacherStatusTab === tab}
                    onClick={() => {
                      setTeacherStatusTab(tab);
                      setTeacherPage(1);
                    }}
                    className={cn(
                      'glass-button-ghost relative isolate min-h-11 shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-small font-medium',
                      teacherStatusTab === tab
                        ? 'text-primary-fg'
                        : 'text-text-muted hover:text-text',
                    )}
                  >
                    {teacherStatusTab === tab ? <GlassTabIndicator tone="tint" /> : null}
                    {t(`classes.teacherFilterStatus.${tab}`)}
                  </button>
                ))}
              </GlassTabGroup>
            </div>

            {/* Thanh tìm kiếm dài ngập khung + Sắp xếp */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full flex-1">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
                />
                <Input
                  type="search"
                  placeholder={t('classes.searchTeacherPlaceholder')}
                  value={teacherFilter}
                  onChange={(e) => {
                    setTeacherFilter(e.target.value);
                    setTeacherPage(1);
                  }}
                  className="w-full pl-9"
                />
              </div>
              <div className="w-full sm:w-56 shrink-0">
                <Select
                  aria-label={t('classes.teacherSort')}
                  value={teacherSort}
                  onChange={(e) => setTeacherSort(e.target.value as TeacherSortOption)}
                >
                  <option value="name_asc">{t('classes.teacherSorts.name_asc')}</option>
                  <option value="most_classes">{t('classes.teacherSorts.most_classes')}</option>
                  <option value="most_students">{t('classes.teacherSorts.most_students')}</option>
                  <option value="newest">{t('classes.teacherSorts.newest')}</option>
                </Select>
              </div>
            </div>
          </div>
        }
        footer={
          <ListPager
            page={currentTeacherPage}
            pageSize={TEACHERS_PAGE_SIZE}
            total={filteredTeachers.length}
            onPageChange={setTeacherPage}
          />
        }
      >
        {filteredTeachers.length === 0 ? (
          teacherFilter || teacherStatusTab !== 'all' ? (
            <ListNoMatch
              text={t('classes.noTeacherMatch')}
              onClear={() => {
                setTeacherFilter('');
                setTeacherStatusTab('all');
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
          <DataTableContainer minWidth="min-w-[710px]">
            <DataTableHeader
              gridTemplateColumns={TEACHER_GRID}
              columns={[
                { label: t('classes.thTeacher') },
                { label: t('classes.thClassesCount'), align: 'center' },
                { label: t('classes.thStudentsCount'), align: 'center' },
                { label: t('classes.thAction'), align: 'right' },
              ]}
            />
            <ul aria-label={t('classes.byTeacherTitle')} className="flex flex-col">
              {pagedTeachers.map((teacher) => (
                <TeacherRow key={teacher.id} teacher={teacher} />
              ))}
            </ul>
          </DataTableContainer>
        )}
      </ListPanel>

      {/* Bảng danh sách học sinh chưa có lớp học */}
      <ListPanel
        title={t('classes.unassignedTitle')}
        count={data.unassignedStudents.length}
        toolbar={
          <div className="flex flex-col gap-3">
            {/* Tabs lọc trạng thái tài khoản */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-border pb-2 sm:flex-wrap">
              <GlassTabGroup>
                {(['all', 'active', 'locked'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    aria-pressed={unassignedStatus === tab}
                    onClick={() => {
                      setUnassignedStatus(tab);
                      setUnassignedPage(1);
                    }}
                    className={cn(
                      'glass-button-ghost relative isolate min-h-11 shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-small font-medium',
                      unassignedStatus === tab
                        ? 'text-primary-fg'
                        : 'text-text-muted hover:text-text',
                    )}
                  >
                    {unassignedStatus === tab ? <GlassTabIndicator tone="tint" /> : null}
                    {t(`classes.status.${tab}`)}
                  </button>
                ))}
              </GlassTabGroup>
            </div>

            {/* Thanh tìm kiếm dài ngập khung + Sắp xếp */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full flex-1">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
                />
                <Input
                  type="search"
                  placeholder={t('classes.searchUnassignedPlaceholder')}
                  value={unassignedFilter}
                  onChange={(e) => {
                    setUnassignedFilter(e.target.value);
                    setUnassignedPage(1);
                  }}
                  className="w-full pl-9"
                />
              </div>
              <div className="w-full sm:w-56 shrink-0">
                <Select
                  aria-label={t('classes.unassignedSort')}
                  value={unassignedSort}
                  onChange={(e) => setUnassignedSort(e.target.value as UnassignedSortOption)}
                >
                  <option value="newest">{t('classes.unassignedSorts.newest')}</option>
                  <option value="oldest">{t('classes.unassignedSorts.oldest')}</option>
                  <option value="name_asc">{t('classes.unassignedSorts.name_asc')}</option>
                  <option value="email_asc">{t('classes.unassignedSorts.email_asc')}</option>
                </Select>
              </div>
            </div>
          </div>
        }
        footer={
          <ListPager
            page={currentUnassignedPage}
            pageSize={UNASSIGNED_PAGE_SIZE}
            total={filteredUnassigned.length}
            onPageChange={setUnassignedPage}
          />
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
          <DataTableContainer minWidth="min-w-[840px]">
            <DataTableHeader
              gridTemplateColumns={UNASSIGNED_GRID}
              columns={[
                { label: t('classes.thStudent') },
                { label: t('classes.thEmail') },
                { label: t('classes.thRegisteredAt') },
                { label: t('classes.thStatus') },
                { label: t('classes.thAction'), align: 'right' },
              ]}
            />
            <ul aria-label={t('classes.unassignedTitle')} className="flex flex-col">
              {pagedUnassigned.map((student) => (
                <UnassignedStudentRow
                  key={student.id}
                  student={student}
                  onLockClick={(s) => setLockTarget(s)}
                  onUnlockSuccess={() => void overview.refetch()}
                />
              ))}
            </ul>
          </DataTableContainer>
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
