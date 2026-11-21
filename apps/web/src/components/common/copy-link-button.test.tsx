import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CopyLinkButton } from './copy-link-button';

const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast: toasts }));

describe('CopyLinkButton', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sao chép đường dẫn đầy đủ', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<CopyLinkButton path="/public/sets/s1" />);

    await user.click(screen.getByRole('button', { name: 'Sao chép đường dẫn' }));

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/public/sets/s1`);
    await waitFor(() => expect(toasts.success).toHaveBeenCalled());
  });

  it('báo lỗi khi trình duyệt chặn clipboard', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    render(<CopyLinkButton path="/public/sets/s1" />);

    await user.click(screen.getByRole('button', { name: 'Sao chép đường dẫn' }));

    await waitFor(() => expect(toasts.error).toHaveBeenCalled());
  });
});
