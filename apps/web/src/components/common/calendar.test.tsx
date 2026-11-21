import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Calendar } from './calendar';

describe('Calendar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 20, 10, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('mở ở tháng của ngày đang chọn, focus ngày đó, đánh dấu hôm nay', () => {
    render(<Calendar selected={{ year: 2026, month: 10, day: 25 }} onPick={vi.fn()} />);

    expect(screen.getByRole('grid', { name: 'Tháng 11, 2026' })).toBeInTheDocument();
    const selected = screen.getByRole('button', { name: 'Thứ Tư, 25/11/2026' });
    expect(selected).toHaveFocus();
    expect(selected).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Thứ Sáu, 20/11/2026' })).toHaveAttribute(
      'aria-current',
      'date',
    );
  });

  it('phím mũi tên đi qua ngày và sang tháng, Enter chọn', async () => {
    const onPick = vi.fn();
    render(<Calendar selected={{ year: 2026, month: 10, day: 30 }} onPick={onPick} />);

    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('grid', { name: 'Tháng 12, 2026' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thứ Ba, 01/12/2026' })).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}{Enter}');
    expect(onPick).toHaveBeenCalledWith({ year: 2026, month: 10, day: 24 });
  });

  it('không chọn được ngày đã qua, nút tháng chuyển tháng', async () => {
    render(<Calendar selected={null} disablePast onPick={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Thứ Năm, 19/11/2026' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Thứ Sáu, 20/11/2026' })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Tháng sau' }));
    expect(screen.getByRole('grid', { name: 'Tháng 12, 2026' })).toBeInTheDocument();
    // Ngày đang focus không thuộc tháng đang xem: ngày 1 nhận Tab.
    expect(screen.getByRole('button', { name: 'Thứ Ba, 01/12/2026' })).toHaveAttribute(
      'tabindex',
      '0',
    );
  });
});
