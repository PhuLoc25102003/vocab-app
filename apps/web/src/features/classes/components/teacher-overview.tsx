'use client';

import { useQuery } from '@tanstack/react-query';
import type { OverviewAssignment, TeacherOverview as Overview } from '@vocab/shared';
import { CircleCheck, Plus, Send } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { classKeys, getTeacherOverview, listClasses } from '../api';
import { dueText } from './class-work';
import { formatDateTime } from '../format';
import { AssignDialog } from './assign-dialog';
import { CreateClassDialog } from './teacher-classes';

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border-strong bg-surface p-4">
      <dd className="text-h2 tabular-nums">{value}</dd>
      <dt className="font-medium">{label}</dt>
      {note ? <dd className="text-small text-text-muted">{note}</dd> : null}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-3 rounded-lg border border-border-strong bg-surface p-4 sm:p-5"
    >
      <h2 className="text-h3">{title}</h2>
      {children}
    </section>
  );
}

const resultsHref = ({ classId, assignmentId }: OverviewAssignment) =>
  `/classes/${classId}/assignments/${assignmentId}` as Route;

function SubmitBar({ submitted, memberCount }: { submitted: number; memberCount: number }) {
  const value = memberCount ? Math.round((submitted * 100) / memberCount) : 0;
  return (
    <span className="flex items-center gap-2">
      <span
        role="meter"
        aria-label="Đã nộp"
        aria-valuemin={0}
        aria-valuemax={memberCount}
        aria-valuenow={submitted}
        className="h-1.5 w-20 overflow-hidden rounded-full bg-border"
      >
        <span className="block h-full bg-primary" style={{ width: `${value}%` }} />
      </span>
      <span className="text-small tabular-nums">
        {submitted}/{memberCount}
      </span>
    </span>
  );
}

function Attention({ attention }: { attention: Overview['attention'] }) {
  const { lowSubmissions, missedStreaks } = attention;
  if (lowSubmissions.length === 0 && missedStreaks.length === 0) {
    return (
      <p className="flex items-center gap-2 text-success">
        <CircleCheck aria-hidden className="size-5" />
        Lớp đang ổn, chưa có gì cần nhắc.
      </p>
    );
  }
  return (
    <ul className="flex flex-col">
      {lowSubmissions.map((item) => (
        <li key={item.assignmentId} className="border-b border-border py-2 last:border-b-0">
          <Link href={resultsHref(item)} className="flex min-h-11 flex-col justify-center">
            <span className="font-medium wrap-anywhere text-primary">
              {item.setTitle} · {item.className}
            </span>
            <span className="text-small text-text-muted">
              {dueText(item.dueAt)} · mới nộp {item.submitted}/{item.memberCount}
            </span>
          </Link>
        </li>
      ))}
      {missedStreaks.map((item) => (
        <li
          key={`${item.classId}:${item.userId}`}
          className="flex min-h-11 flex-col justify-center border-b border-border py-2 last:border-b-0"
        >
          <Link
            href={`/classes/${item.classId}/members/${item.userId}` as Route}
            className="font-medium wrap-anywhere text-primary"
          >
            {item.displayName}
          </Link>
          <span className="text-small text-danger">
            Bỏ lỡ {item.missed} bài liền · {item.className}
          </span>
        </li>
      ))}
    </ul>
  );
}

function EmptyClasses({ onCreate }: { onCreate: () => void }) {
  const steps = [
    'Tạo lớp và đặt tên dễ nhận ra, ví dụ "10A1 - Tiếng Anh".',
    'Gửi mã lớp 6 ký tự cho học sinh để các em tham gia.',
    'Giao bộ từ kèm các chế độ và hạn nộp.',
  ];
  return (
    <section
      aria-label="Bắt đầu với lớp học"
      className="flex flex-col gap-4 rounded-lg border border-border-strong bg-surface p-6"
    >
      <h2 className="text-h2">Bắt đầu dạy trong 3 bước</h2>
      <ol className="flex flex-col gap-3">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3">
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary tabular-nums"
            >
              {index + 1}
            </span>
            <span className="pt-1">{step}</span>
          </li>
        ))}
      </ol>
      <Button className="self-start" onClick={onCreate}>
        <Plus aria-hidden className="size-4" />
        Tạo lớp đầu tiên
      </Button>
    </section>
  );
}

/** Tổng quan của giáo viên (việc 5.20): "Lớp nào, bài nào, em nào cần tôi nhắc?". */
export function TeacherOverview() {
  const [dialog, setDialog] = useState<'assign' | 'create' | null>(null);
  const overview = useQuery({ queryKey: classKeys.teacherOverview, queryFn: getTeacherOverview });
  const classes = useQuery({
    queryKey: classKeys.list(false, 1),
    queryFn: () => listClasses(false, 1),
    enabled: overview.isSuccess && overview.data.classCount > 0,
  });

  const noClasses = overview.isSuccess && overview.data.classCount === 0;
  const header = (
    <PageHeader
      title="Tổng quan"
      actions={
        overview.isSuccess ? (
          noClasses ? (
            <Button onClick={() => setDialog('create')}>
              <Plus aria-hidden className="size-4" />
              Tạo lớp
            </Button>
          ) : (
            <Button onClick={() => setDialog('assign')}>
              <Send aria-hidden className="size-4" />
              Giao bài
            </Button>
          )
        ) : null
      }
    />
  );
  const dialogs = (
    <>
      <CreateClassDialog
        open={dialog === 'create'}
        onOpenChange={(open) => setDialog(open ? 'create' : null)}
      />
      <AssignDialog
        classes={classes.data?.data ?? []}
        open={dialog === 'assign'}
        onOpenChange={(open) => setDialog(open ? 'assign' : null)}
      />
    </>
  );

  if (overview.isPending) {
    return (
      <>
        {header}
        <LoadingState label="Đang tải tổng quan lớp học">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </LoadingState>
      </>
    );
  }
  if (overview.isError) {
    return (
      <>
        {header}
        <ErrorState
          title="Không tải được tổng quan lớp học"
          description="Kiểm tra kết nối mạng rồi thử lại."
          onRetry={() => void overview.refetch()}
        />
      </>
    );
  }
  const data = overview.data;
  if (noClasses) {
    return (
      <>
        {header}
        <EmptyClasses onCreate={() => setDialog('create')} />
        {dialogs}
      </>
    );
  }

  return (
    <>
      {header}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Lớp đang dạy" value={String(data.classCount)} />
        <Tile
          label="Học sinh"
          value={String(data.studentCount)}
          note={data.newStudents ? `+${data.newStudents} trong 7 ngày` : undefined}
        />
        <Tile
          label="Bài đang mở"
          value={String(data.openAssignmentCount)}
          note={data.dueSoonCount ? `${data.dueSoonCount} bài hạn trong 48 giờ` : undefined}
        />
        <Tile
          label="Nộp đúng hạn"
          value={data.onTimeRate === null ? 'Chưa có' : `${data.onTimeRate}%`}
          note="30 ngày qua"
        />
      </dl>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Cần chú ý">
          <Attention attention={data.attention} />
        </Panel>
        <Panel title="Sắp đến hạn">
          {data.upcoming.length === 0 ? (
            <p className="text-text-muted">Không có bài nào sắp đến hạn.</p>
          ) : (
            <ul className="flex flex-col">
              {data.upcoming.map((item) => (
                <li key={item.assignmentId} className="border-b border-border last:border-b-0">
                  <Link
                    href={resultsHref(item)}
                    className="flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2 hover:bg-primary-soft sm:px-2"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium wrap-anywhere">
                        {item.setTitle} · {item.className}
                      </span>
                      <span className="text-small text-text-muted">{dueText(item.dueAt)}</span>
                    </span>
                    <SubmitBar submitted={item.submitted} memberCount={item.memberCount} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <Panel title="Bài vừa nộp">
        {data.recentSubmissions.length === 0 ? (
          <p className="text-text-muted">Chưa có học sinh nào nộp bài.</p>
        ) : (
          <ul className="flex flex-col">
            {data.recentSubmissions.map((item) => (
              <li
                key={`${item.assignmentId}:${item.userId}`}
                className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 border-b border-border py-2 text-small last:border-b-0"
              >
                <Link
                  href={`/classes/${item.classId}/members/${item.userId}` as Route}
                  className="font-medium text-primary wrap-anywhere"
                >
                  {item.displayName}
                </Link>
                <span className="min-w-0 wrap-anywhere">
                  {item.setTitle} · {item.className}
                </span>
                <span className="tabular-nums">
                  {item.score === null ? 'Đã nộp' : `${item.score}%`}
                  {item.late ? ' · trễ' : ''}
                </span>
                <span className="ml-auto text-text-muted">{formatDateTime(item.submittedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {dialogs}
    </>
  );
}
