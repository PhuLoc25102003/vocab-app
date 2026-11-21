import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { AppNav } from './app-nav';

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }));

describe('AppNav', () => {
  it('có liên kết tới các khu vực chính', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<AppNav />);

    expect(screen.getByRole('link', { name: 'Tổng quan' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Bộ từ' })).toHaveAttribute('href', '/sets');
    expect(screen.getByRole('link', { name: 'Khám phá' })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: 'Ôn hôm nay' })).toHaveAttribute('href', '/review');
  });

  it('đánh dấu mục hiện tại, kể cả trang con', () => {
    vi.mocked(usePathname).mockReturnValue('/sets/abc');
    render(<AppNav />);

    expect(screen.getByRole('link', { name: 'Bộ từ' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Tổng quan' })).not.toHaveAttribute('aria-current');
  });

  it('không nhầm đường dẫn có cùng tiền tố', () => {
    vi.mocked(usePathname).mockReturnValue('/sets-archive');
    render(<AppNav />);

    expect(screen.getByRole('link', { name: 'Bộ từ' })).not.toHaveAttribute('aria-current');
  });

  it('mọi người đều có mục Lớp học', () => {
    vi.mocked(usePathname).mockReturnValue('/classes/c1');
    render(<AppNav />);

    expect(screen.getByRole('link', { name: 'Lớp học' })).toHaveAttribute('aria-current', 'page');
  });
});
