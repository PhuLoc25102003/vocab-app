'use client';

import { X } from 'lucide-react';
import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { FormError } from '@/components/common/form-message';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  submitLabel: string;
  cancelLabel?: string;
  /** Đang gửi: nút gửi hiện vòng quay, không đóng được hộp thoại. */
  pending?: boolean;
  /** Lỗi từ máy chủ, hiện ngay trên chân hộp thoại. */
  error?: string | null;
  /** Đã nhập gì đó: đóng thì hỏi lại để không mất nội dung. */
  dirty?: boolean;
  /** Ví dụ `handleSubmit(save)` của react-hook-form. */
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  /** `lg` cho form có danh sách hoặc hai cột, ví dụ giao bài. */
  size?: 'md' | 'lg';
  children: ReactNode;
}

const FIRST_FIELD =
  'input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [data-autofocus]';

/**
 * Form ngắn trong hộp thoại: tạo lớp, đổi tên, giao bài. Thay cho việc chèn form vào trang làm
 * xô lệch bố cục. Cao theo nội dung; dưới 640 px là tấm đáy, nút gửi luôn ở chân.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  cancelLabel = 'Huỷ',
  pending = false,
  error,
  dirty = false,
  onSubmit,
  size = 'md',
  children,
}: FormDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const requestClose = () => {
    if (pending) {
      return;
    }
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onOpenChange(false);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    // Sự kiện React vẫn lan qua portal tới form cha của trang.
    event.stopPropagation();
    onSubmit(event);
  };

  return (
    <>
      <Dialog
        open={open}
        onRequestClose={requestClose}
        labelledBy={titleId}
        describedBy={description ? descriptionId : undefined}
        initialFocus={() => formRef.current?.querySelector<HTMLElement>(FIRST_FIELD) ?? null}
        layout="sheet"
        size={size}
      >
        <form ref={formRef} onSubmit={submit} noValidate className="flex max-h-[inherit] flex-col">
          <div className="flex items-start gap-3 border-b border-border px-6 pt-5 pb-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2 id={titleId} className="text-h3 wrap-anywhere">
                {title}
              </h2>
              {description ? (
                <div id={descriptionId} className="text-small text-text-muted">
                  {description}
                </div>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Đóng"
              disabled={pending}
              onClick={requestClose}
              className="-mt-2 -mr-3 shrink-0"
            >
              <X aria-hidden className="size-5" />
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-6 py-5">
            {children}
          </div>
          <div className="flex flex-col gap-3 border-t border-border px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {error ? <FormError>{error}</FormError> : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" disabled={pending} onClick={requestClose}>
                {cancelLabel}
              </Button>
              <Button type="submit" loading={pending}>
                {submitLabel}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Bỏ nội dung đang nhập?"
        description="Những gì bạn đã nhập trong hộp thoại này sẽ mất."
        confirmLabel="Bỏ nội dung"
        cancelLabel="Nhập tiếp"
        onConfirm={() => {
          setConfirmDiscard(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
