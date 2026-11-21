import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DateTimeField } from './date-time-field';

const hiddenValue = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>('input[name="dueAt"]')?.value;

describe('DateTimeField', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 20, 10, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('gõ ngày và giờ kiểu Việt Nam thì ra giá trị datetime-local', async () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <DateTimeField label="Hạn nộp" name="dueAt" onValueChange={onValueChange} />,
    );

    await userEvent.type(screen.getByLabelText('Ngày'), '21/11/2026');
    expect(hiddenValue(container)).toBe('2026-11-21T23:59');

    const time = screen.getByLabelText('Giờ');
    await userEvent.clear(time);
    await userEvent.type(time, '7:30');
    await userEvent.tab();
    expect(time).toHaveValue('07:30');
    expect(onValueChange).toHaveBeenLastCalledWith('2026-11-21T07:30');
  });

  it('ngày không có thật thì ô ngày báo sai và giá trị là invalid', async () => {
    const { container } = render(<DateTimeField label="Hạn nộp" name="dueAt" />);

    await userEvent.type(screen.getByLabelText('Ngày'), '31/02/2026');

    expect(screen.getByLabelText('Ngày')).toHaveAttribute('aria-invalid', 'true');
    expect(hiddenValue(container)).toBe('invalid');
  });

  it('nút nhanh chọn hết hôm nay, ngày mai, 1 tuần và bỏ hạn', async () => {
    const { container } = render(<DateTimeField label="Hạn nộp" name="dueAt" />);

    await userEvent.click(screen.getByRole('button', { name: 'Ngày mai' }));
    expect(screen.getByLabelText('Ngày')).toHaveValue('21/11/2026');
    expect(hiddenValue(container)).toBe('2026-11-21T23:59');

    await userEvent.click(screen.getByRole('button', { name: '1 tuần' }));
    expect(hiddenValue(container)).toBe('2026-11-27T23:59');

    await userEvent.click(screen.getByRole('button', { name: 'Không có hạn' }));
    expect(hiddenValue(container)).toBe('');
  });

  it('chọn ngày trên lịch bằng bàn phím', async () => {
    const { container } = render(
      <DateTimeField label="Hạn nộp" name="dueAt" defaultValue="2026-11-20T08:00" />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Chọn ngày trên lịch' }));
    const calendar = screen.getByRole('dialog', { name: 'Chọn ngày' });
    expect(within(calendar).getByRole('grid', { name: 'Tháng 11, 2026' })).toBeInTheDocument();
    const selected = within(calendar).getByRole('button', { name: 'Thứ Sáu, 20/11/2026' });
    expect(selected).toHaveFocus();
    expect(selected).toHaveAttribute('aria-pressed', 'true');

    await userEvent.keyboard('{ArrowDown}{ArrowRight}');
    expect(within(calendar).getByRole('button', { name: 'Thứ Bảy, 28/11/2026' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    expect(screen.getByLabelText('Ngày')).toHaveValue('28/11/2026');
    expect(hiddenValue(container)).toBe('2026-11-28T08:00');
    expect(screen.getByLabelText('Ngày')).toHaveFocus();
  });
});
