'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAssignmentSchema,
  MAX_ASSIGNMENT_MODES,
  STUDY_MODE_LABELS,
  studyModeSchema,
  type StudyMode,
} from '@vocab/shared';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { DateTimeField } from '@/components/common/date-time-field';
import { FormDialog } from '@/components/common/form-dialog';
import { SelectField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { classKeys, createAssignment, listMySetsForAssigning } from '../api';

type FieldErrors = Partial<Record<'setId' | 'modes' | 'dueAt' | 'shareToClass', string>>;

/** Giá trị `YYYY-MM-DDTHH:mm` không có múi giờ, hiểu theo giờ máy của giáo viên rồi đổi sang ISO. */
function toIsoDue(local: string): string | null {
  if (!local) return null;
  const date = new Date(local);
  return Number.isNaN(date.getTime()) ? 'invalid' : date.toISOString();
}

/** Giống lộ trình "Bắt đầu học": nhận mặt từ, chọn nghĩa, ghép nhanh, rồi tự viết lại. */
const DEFAULT_MODES: StudyMode[] = ['FLASHCARD', 'MCQ', 'MATCH', 'WRITE'];

interface AssignDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Giao bộ từ cho lớp: chọn bộ, các chế độ theo thứ tự, hạn nộp. Bộ riêng tư cần đồng ý chia sẻ. */
export function AssignDialog({ classId, open, onOpenChange }: AssignDialogProps) {
  const queryClient = useQueryClient();
  const sets = useQuery({
    queryKey: classKeys.mySets,
    queryFn: listMySetsForAssigning,
    enabled: open,
  });
  const assign = useMutation({
    mutationFn: (dto: Parameters<typeof createAssignment>[1]) => createAssignment(classId, dto),
  });
  const [query, setQuery] = useState('');
  const [setId, setSetId] = useState('');
  const [modes, setModes] = useState<StudyMode[]>(DEFAULT_MODES);
  const [due, setDue] = useState('');
  const [share, setShare] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const selected = sets.data?.find((set) => set.id === setId);
  const isPrivate = selected?.visibility === 'PRIVATE';
  const filtered = (sets.data ?? []).filter((set) =>
    set.title.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')),
  );
  const dirty = setId !== '' || due !== '' || modes.join() !== DEFAULT_MODES.join();

  const close = (next: boolean) => {
    if (!next) {
      setQuery('');
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
        await queryClient.invalidateQueries({ queryKey: classKeys.assignments(classId) });
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
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
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
          {sets.data.length > 6 ? (
            <Input
              type="search"
              aria-label="Tìm bộ từ"
              placeholder="Tìm bộ từ"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          ) : null}
          <SelectField
            label="Bộ từ"
            value={setId}
            onChange={(event) => {
              setSetId(event.target.value);
              setShare(false);
            }}
            error={errors.setId}
          >
            <option value="" disabled>
              Chọn bộ từ
            </option>
            {filtered.map((set) => (
              <option key={set.id} value={set.id}>
                {set.title} ({set.cardCount} thẻ){set.visibility === 'PRIVATE' ? ', riêng tư' : ''}
              </option>
            ))}
          </SelectField>
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
        <legend className="mb-1 text-small font-medium">
          Chế độ học (theo thứ tự, tối đa {MAX_ASSIGNMENT_MODES})
        </legend>
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
                  disabled={modes.length >= MAX_ASSIGNMENT_MODES || tooFewCards(mode)}
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
