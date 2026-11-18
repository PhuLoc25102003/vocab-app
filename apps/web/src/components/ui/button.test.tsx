import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
});
