import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('bật và tắt giao diện tối', async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Giao diện tối' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(button);
    expect(document.documentElement).toHaveClass('dark');
    expect(button).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(button);
    expect(document.documentElement).not.toHaveClass('dark');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });
});
