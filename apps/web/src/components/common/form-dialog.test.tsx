import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormDialog } from './form-dialog';

function Harness({
  pending = false,
  error = null,
  onSubmit = vi.fn(),
  onPageSubmit = vi.fn(),
}: {
  pending?: boolean;
  error?: string | null;
  onSubmit?: () => void;
  onPageSubmit?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onPageSubmit();
      }}
    >
      <button type="button" onClick={() => setOpen(true)}>
        Tạo lớp
      </button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Tạo lớp"
        description="Học sinh vào lớp bằng mã."
        submitLabel="Tạo"
        pending={pending}
        error={error}
        dirty={name !== ''}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label>
          Tên lớp
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
      </FormDialog>
    </form>
  );
}

const openDialog = () => userEvent.click(screen.getByRole('button', { name: 'Tạo lớp' }));

describe('FormDialog', () => {
  it('mở thì focus ô đầu tiên, có tiêu đề và mô tả', async () => {
    render(<Harness />);
    await openDialog();

    const dialog = screen.getByRole('dialog', { name: 'Tạo lớp' });
    expect(dialog).toHaveAccessibleDescription('Học sinh vào lớp bằng mã.');
    expect(screen.getByLabelText('Tên lớp')).toHaveFocus();
  });

  it('chưa nhập gì thì Esc, nút Đóng và Huỷ đóng ngay', async () => {
    render(<Harness />);

    await openDialog();
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(screen.queryByLabelText('Tên lớp')).not.toBeInTheDocument();

    await openDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(screen.queryByLabelText('Tên lớp')).not.toBeInTheDocument();

    await openDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Huỷ' }));
    expect(screen.queryByLabelText('Tên lớp')).not.toBeInTheDocument();
  });

  it('đã nhập thì hỏi lại trước khi đóng, "Nhập tiếp" giữ nội dung', async () => {
    render(<Harness />);
    await openDialog();
    await userEvent.type(screen.getByLabelText('Tên lớp'), '10A1');

    await userEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(screen.getByRole('dialog', { name: 'Bỏ nội dung đang nhập?' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Nhập tiếp' }));
    expect(screen.getByLabelText('Tên lớp')).toHaveValue('10A1');

    await userEvent.click(screen.getByRole('button', { name: 'Huỷ' }));
    await userEvent.click(screen.getByRole('button', { name: 'Bỏ nội dung' }));
    expect(screen.queryByLabelText('Tên lớp')).not.toBeInTheDocument();
  });

  it('gửi form trong hộp thoại không gửi form của trang', async () => {
    const onSubmit = vi.fn();
    const onPageSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} onPageSubmit={onPageSubmit} />);
    await openDialog();

    await userEvent.type(screen.getByLabelText('Tên lớp'), '10A1{Enter}');

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onPageSubmit).not.toHaveBeenCalled();
  });

  it('đang gửi thì không đóng được, lỗi máy chủ hiện trong hộp thoại', async () => {
    render(<Harness pending error="Tên lớp đã tồn tại" />);
    await openDialog();

    expect(screen.getByRole('alert')).toHaveTextContent('Tên lớp đã tồn tại');
    expect(screen.getByRole('button', { name: 'Đóng' })).toBeDisabled();
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(screen.getByLabelText('Tên lớp')).toBeInTheDocument();
  });
});
