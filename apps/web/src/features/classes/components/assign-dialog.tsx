'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAssignmentSchema,
  STUDY_MODE_LABELS,
  studyModeSchema,
  type StudyMode,
} from '@vocab/shared';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { DateTimeField } from '@/components/common/date-time-field';
import { FormDialog } from '@/components/common/form-dialog';
import { Combobox } from '@/components/common/combobox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { classKeys, createAssignment, listMySetsForAssigning } from '../api';

type FieldErrors = Partial<
  Record<'classId' | 'setId' | 'modes' | 'dueAt' | 'shareToClass', string>
>;

/** Giá trị `YYYY-MM-DDTHH:mm` không có múi giờ, hiểu theo giờ máy của giáo viên rồi đổi sang ISO. */
function toIsoDue(local: string): string | null {
  if (!local) return null;
  const date = new Date(local);
  return Number.isNaN(date.getTime()) ? 'invalid' : date.toISOString();
}

/** Giống lộ trình "Bắt đầu học": nhận mặt từ, chọn nghĩa, ghép nhanh, rồi tự viết lại. */
const DEFAULT_MODES: StudyMode[] = ['FLASHCARD', 'MCQ', 'MATCH', 'WRITE'];

interface AssignDialogProps {
  /** Lớp cố định khi mở từ trang lớp. Không có thì hiện ô chọn lớp trong `classes`. */
  classId?: string;
  classes?: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Giao bộ từ cho lớp: chọn bộ, các chế độ theo thứ tự, hạn nộp. Bộ riêng tư cần đồng ý chia sẻ. */
export function AssignDialog({
  classId: fixedClassId,
  classes = [],
  open,
  onOpenChange,
}: AssignDialogProps) {
  const queryClient = useQueryClient();
  const sets = useQuery({
    queryKey: classKeys.mySets,
    queryFn: listMySetsForAssigning,
    enabled: open,
  });
  const [pickedClassId, setPickedClassId] = useState('');
  const classId = fixedClassId ?? pickedClassId;
  const assign = useMutation({
    mutationFn: (dto: Parameters<typeof createAssignment>[1]) => createAssignment(classId, dto),
  });
  const [setId, setSetId] = useState('');
  const [modes, setModes] = useState<StudyMode[]>(DEFAULT_MODES);
  const [due, setDue] = useState('');
  const [share, setShare] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const selected = sets.data?.find((set) => set.id === setId);
  const isPrivate = selected?.visibility === 'PRIVATE';
  const dirty = setId !== '' || due !== '' || modes.join() !== DEFAULT_MODES.join();

  const close = (next: boolean) => {
    if (!next) {
      setPickedClassId('');
      setSetId('');
      setModes(DEFAULT_MODES);
      setDue('');
      setShare(false);
      setErrors({});
      assign.reset();
    }
    onOpenChange(next);
  };

  const toggle = (mode: StudyMode) =>
    setModes((current) =>
      current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode],
    );
  const move = (index: number, step: -1 | 1) =>
    setModes((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      if (item) next.splice(index + step, 0, item);
      return next;
    });

  const submit = () => {
    const parsed = createAssignmentSchema.safeParse({
      setId,
      modes,
      dueAt: toIsoDue(due),
      shareToClass: isPrivate ? share : undefined,
    });
    const next: FieldErrors = {};
    if (!classId) next.classId = 'Hãy chọn lớp';
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'setId' || key === 'modes' || key === 'dueAt') next[key] ??= issue.message;
      }
    }
    if (isPrivate && !share) next.shareToClass = 'Hãy đồng ý cho học sinh trong lớp xem bộ này';
    setErrors(next);
    if (!parsed.success || Object.keys(next).length) return;
    assign.mutate(parsed.data, {
      onSuccess: async (created) => {
        await queryClient.invalidateQueries({ queryKey: classKeys.all });
        if (isPrivate) await queryClient.invalidateQueries({ queryKey: classKeys.mySets });
        toast.success(`Đã giao ${created.setTitle}`);
        close(false);
      },
    });
  };

  const others = studyModeSchema.options.filter((mode) => !modes.includes(mode));
  const tooFewCards = (mode: StudyMode) => mode === 'MATCH' && (selected?.cardCount ?? 2) < 2;

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title="Giao bài"
      description="Học sinh làm lần lượt các chế độ rồi bấm Nộp bài."
      submitLabel="Giao bài"
      pending={assign.isPending}
      error={assign.error ? formErrorMessage(assign.error) : null}
      dirty={dirty}
      size="lg"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {fixedClassId ? null : (
        <Combobox
          label="Lớp"
          placeholder="Chọn lớp"
          value={pickedClassId}
          onChange={setPickedClassId}
          error={errors.classId}
          options={classes.map(({ id, name }) => ({ value: id, label: name }))}
        />
      )}
      {sets.isPending ? (
        <Skeleton className="h-11 w-full" />
      ) : sets.isError ? (
        <p role="alert" className="text-small text-danger">
          Không tải được bộ từ của bạn.{' '}
          <button type="button" className="underline" onClick={() => void sets.refetch()}>
            Thử lại
          </button>
        </p>
      ) : sets.data.length === 0 ? (
        <p className="text-text-muted">
          Bạn chưa có bộ từ nào. Tạo bộ từ ở mục Bộ từ rồi quay lại.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <Combobox
            label="Bộ từ"
            placeholder="Chọn hoặc gõ tên bộ từ"
            emptyText="Không có bộ từ nào khớp"
            value={setId}
            onChange={(next) => {
              setSetId(next);
              setShare(false);
            }}
            error={errors.setId}
            options={sets.data.map((set) => ({
              value: set.id,
              label: set.title,
              description: `${set.cardCount} thẻ${set.visibility === 'PRIVATE' ? ' · Riêng tư' : ''}`,
            }))}
          />
          {isPrivate ? (
            <div className="flex flex-col gap-1 rounded-md border border-border-strong bg-primary-soft p-3 text-small">
              <p>
                Bộ này đang Riêng tư. Khi giao, học sinh của lớp sẽ xem được bộ này, người ngoài lớp
                vẫn không thấy.
              </p>
              <label className="flex min-h-11 items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  className="size-5 accent-primary"
                  checked={share}
                  onChange={(event) => setShare(event.target.checked)}
                />
                Cho học sinh trong lớp xem bộ này
              </label>
              {errors.shareToClass ? <p className="text-danger">{errors.shareToClass}</p> : null}
            </div>
          ) : null}
        </div>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-small font-medium">Chế độ học (theo thứ tự)</legend>
        <div className="-mt-1 flex flex-wrap gap-1">
          <div className="contents">
            <Button
              type="button"
              variant="ghost"
              disabled={others.every((mode) => tooFewCards(mode))}
              onClick={() => setModes([...modes, ...others.filter((mode) => !tooFewCards(mode))])}
            >
              Chọn tất cả
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={modes.length === 0}
              onClick={() => setModes([])}
            >
              Bỏ chọn
            </Button>
          </div>
        </div>
        <ol className="flex flex-col gap-1">
          {modes.map((mode, index) => (
            <li
              key={mode}
              className="flex min-h-11 items-center gap-2 rounded-md border border-primary bg-primary-soft px-2"
            >
              <label className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  type="checkbox"
                  className="size-5 accent-primary"
                  checked
                  onChange={() => toggle(mode)}
                />
                <span className="tabular-nums text-text-muted">{index + 1}.</span>
                {STUDY_MODE_LABELS[mode]}
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Đưa ${STUDY_MODE_LABELS[mode]} lên`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp aria-hidden className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Đưa ${STUDY_MODE_LABELS[mode]} xuống`}
                disabled={index === modes.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown aria-hidden className="size-4" />
              </Button>
            </li>
          ))}
        </ol>
        <ul className="flex flex-wrap gap-2">
          {others.map((mode) => (
            <li key={mode}>
              <label className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-small">
                <input
                  type="checkbox"
                  className="size-5 accent-primary"
                  checked={false}
                  disabled={tooFewCards(mode)}
                  onChange={() => toggle(mode)}
                />
                {STUDY_MODE_LABELS[mode]}
              </label>
            </li>
          ))}
        </ul>
        {modes.includes('SPEAK') ? (
          <p className="text-small text-text-muted">
            Luyện nói cần micro và trình duyệt hỗ trợ. Học sinh không nói được có thể bỏ qua từng
            câu.
          </p>
        ) : null}
        {errors.modes ? <p className="text-small text-danger">{errors.modes}</p> : null}
      </fieldset>

      <DateTimeField
        label="Hạn nộp (không bắt buộc)"
        disablePast
        onValueChange={setDue}
        hint="Bỏ trống nếu bài không có hạn. Giờ mặc định là 23:59."
        error={errors.dueAt}
      />
    </FormDialog>
  );
}
