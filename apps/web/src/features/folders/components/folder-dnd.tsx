'use client';

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { NO_FOLDER } from '@vocab/shared';
import { GripVertical, Layers } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { formErrorMessage } from '@/lib/form-errors';
import { useMoveAnySet } from '../hooks';

interface DragData {
  title: string;
  folderId: string | null;
}

/**
 * Vùng kéo thả của trang Bộ từ: kéo tay nắm trên thẻ bộ từ rồi thả vào thư mục trên cột thư mục.
 * Chuột bắt đầu kéo sau 8 px, cảm ứng phải giữ 250 ms để không cản cuộn trang.
 * Kéo thả chỉ là lối tắt, nút thư mục trên thẻ vẫn làm được mọi việc bằng bàn phím.
 */
export function FolderDndArea({ children }: { children: ReactNode }) {
  const move = useMoveAnySet();
  const [dragging, setDragging] = useState<DragData | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    setDragging((active.data.current as DragData | undefined) ?? null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    const data = active.data.current as DragData | undefined;
    if (!over || !data) {
      return;
    }
    const target = String(over.id);
    const folderId = target === NO_FOLDER ? null : target;
    if (folderId === data.folderId) {
      return;
    }
    // Promise vẫn resolve khi thẻ bộ từ đã rời danh sách đang xem, callback của `mutate` thì không.
    move.mutateAsync({ setId: String(active.id), folderId }).then(
      () =>
        toast.success(folderId ? `Đã chuyển "${data.title}" vào thư mục` : 'Đã gỡ khỏi thư mục'),
      (error: unknown) => toast.error(formErrorMessage(error)),
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
      accessibility={{ screenReaderInstructions: { draggable: '' } }}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {dragging ? (
          <div className="flex max-w-64 items-center gap-2 rounded-md border border-primary bg-surface px-3 py-2 text-small font-medium shadow-raised">
            <Layers aria-hidden className="size-4 shrink-0 text-primary" />
            <span className="truncate">{dragging.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface SetDragHandleProps {
  setId: string;
  title: string;
  folderId: string | null;
}

/** Tay nắm để kéo thẻ bộ từ. Ẩn khỏi trình đọc màn hình vì đã có nút thư mục làm cùng việc. */
export function SetDragHandle({ setId, title, folderId }: SetDragHandleProps) {
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: setId,
    data: { title, folderId } satisfies DragData,
  });
  return (
    <span
      ref={setNodeRef}
      {...listeners}
      aria-hidden
      title="Kéo vào một thư mục"
      data-drag-handle={setId}
      className={`inline-flex size-11 cursor-grab touch-none items-center justify-center rounded-md text-text-muted transition-colors duration-fast ease-standard hover:bg-surface hover:text-primary active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <GripVertical className="size-5" />
    </span>
  );
}

/** Đánh dấu một mục là nơi thả. `id` là id thư mục hoặc `none` để gỡ khỏi thư mục. */
export function useFolderDrop(id: string | undefined) {
  const { setNodeRef, isOver, active } = useDroppable({ id: id ?? '', disabled: !id });
  return { setNodeRef, isOver: Boolean(id) && isOver, isDragging: Boolean(active) };
}
