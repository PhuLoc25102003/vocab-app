import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './confirm-dialog';

function Harness({ onConfirm, pending = false }: { onConfirm: () => void; pending?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Mở
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title='Xoá bộ từ "Hương 1"?'
        description="Bạn sẽ không khôi phục được."
        confirmLabel="Xoá bộ từ"
        pending={pending}
        onConfirm={onConfirm}
      />
    </>
  );
}

describe('ConfirmDialog', () => {
  it('mở hộp thoại có tiêu đề, mô tả, focus vào nút huỷ', async () => {
    render(<Harness onConfirm={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Mở' }));

    const dialog = screen.getByRole('dialog', { name: 'Xoá bộ từ "Hương 1"?' });
    expect(dialog).toHaveAccessibleDescription('Bạn sẽ không khôi phục được.');
    expect(screen.getByRole('button', { name: 'Huỷ' })).toHaveFocus();
  });

  it('bấm xoá thì gọi onConfirm, bấm huỷ thì đóng', async () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: 'Mở' }));

    await userEvent.click(screen.getByRole('button', { name: 'Xoá bộ từ' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Huỷ' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Esc đóng hộp thoại, trừ khi đang xoá', async () => {
    const { rerender } = render(<Harness onConfirm={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Mở' }));
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<Harness onConfirm={vi.fn()} pending />);
    await userEvent.click(screen.getByRole('button', { name: 'Mở' }));
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
