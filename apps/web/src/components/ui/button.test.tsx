import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Link from 'next/link';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('mặc định là type button để không tự gửi form', () => {
    render(<Button>Lưu bộ từ</Button>);
    expect(screen.getByRole('button', { name: 'Lưu bộ từ' })).toHaveAttribute('type', 'button');
  });

  it('gọi onClick khi bấm', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Lưu bộ từ</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Lưu bộ từ' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('không gọi onClick khi bị vô hiệu hoá', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Lưu bộ từ
      </Button>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Lưu bộ từ' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('khoá bấm và giữ tên nút khi đang gửi', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Lưu bộ từ
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Lưu bộ từ' });

    await userEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('dùng được cho liên kết qua asChild', () => {
    render(
      <Button asChild variant="secondary">
        <Link href="/sets">Xem bộ từ</Link>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Xem bộ từ' });

    expect(link).toHaveAttribute('href', '/sets');
    expect(link).toHaveClass('border-border-strong');
    expect(link).not.toHaveAttribute('type');
  });
});
