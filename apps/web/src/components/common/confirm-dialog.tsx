'use client';

import { AlertTriangle } from 'lucide-react';
import { useId, useRef, type FormEvent, type ReactNode } from 'react';
import { FormError } from '@/components/common/form-message';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nói rõ xoá gì, ví dụ `Xoá bộ từ "Hương 1"?`. */
  title: string;
  /** Hậu quả của việc xoá. */
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Đang xoá: nút xoá hiện vòng quay, không đóng được hộp thoại. */
  pending?: boolean;
  /** Lỗi từ máy chủ, hiện ngay trong hộp thoại. */
  error?: string | null;
  /** Trường nhập thêm, ví dụ mật khẩu để xác nhận. */
  children?: ReactNode;
  onConfirm: () => void;
}

/** Hộp thoại xác nhận cho thao tác xoá hoặc không hoàn tác được. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Huỷ',
  pending = false,
  error,
  children,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const close = () => {
    if (!pending) {
      onOpenChange(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    // Sự kiện React vẫn lan qua portal tới form cha, ví dụ form sửa bộ từ.
    event.stopPropagation();
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onRequestClose={close}
      labelledBy={titleId}
      describedBy={descriptionId}
      // Nút huỷ nhận focus đầu tiên để Enter vô tình không xoá mất dữ liệu.
      initialFocus={cancelRef}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4 p-6">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger"
          >
            <AlertTriangle className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={titleId} className="text-h3 wrap-anywhere">
              {title}
            </h2>
            <div id={descriptionId} className="text-small text-text-muted">
              {description}
            </div>
          </div>
        </div>
        {children}
        {error ? <FormError>{error}</FormError> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            ref={cancelRef}
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={close}
          >
            {cancelLabel}
          </Button>
          <Button type="submit" variant="danger" loading={pending}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
