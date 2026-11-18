import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PasswordField } from './password-field';

describe('PasswordField', () => {
  it('hiện và ẩn mật khẩu mà không gửi form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <PasswordField label="Mật khẩu" defaultValue="bi-mat" />
      </form>,
    );
    const input = screen.getByLabelText('Mật khẩu');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveValue('bi-mat');

    await user.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
    expect(input).toHaveAttribute('type', 'password');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
