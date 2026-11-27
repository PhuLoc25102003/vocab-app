import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RainKeyboard } from './rain-keyboard';

describe('RainKeyboard', () => {
  it('gửi chữ khi chạm phím, không gửi lặp ở click theo sau', () => {
    const onKey = vi.fn();
    render(<RainKeyboard onKey={onKey} onDelete={vi.fn()} />);
    const key = screen.getByRole('button', { name: 'w' });
    fireEvent.pointerDown(key);
    fireEvent.click(key);
    expect(onKey).toHaveBeenCalledTimes(1);
    expect(onKey).toHaveBeenCalledWith('w');
  });

  it('click từ trình đọc màn hình vẫn gõ được, nút xoá gọi onDelete', () => {
    const onKey = vi.fn();
    const onDelete = vi.fn();
    render(<RainKeyboard onKey={onKey} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: 'q' }));
    expect(onKey).toHaveBeenCalledWith('q');
    expect(screen.getAllByRole('button')).toHaveLength(27);
    fireEvent.pointerDown(screen.getByRole('button', { name: /xoá|clear/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
