import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearSessionMarker, setSessionMarker } from '@/lib/session-marker';
import { LandingPage } from './landing-page';

vi.mock('@/components/common/theme-toggle', () => ({ ThemeToggle: () => null }));

describe('LandingPage', () => {
  afterEach(clearSessionMarker);

  it('giới thiệu sản phẩm và đủ bốn chế độ học', () => {
    render(<LandingPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('ôn đúng lúc');
    for (const mode of ['Flashcard', 'Viết', 'Nghe viết', 'Trắc nghiệm']) {
      expect(screen.getByText(mode)).toBeInTheDocument();
    }
  });

  it('mời khách tạo tài khoản', () => {
    render(<LandingPage />);

    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login');
    for (const link of screen.getAllByRole('link', { name: 'Tạo tài khoản' })) {
      expect(link).toHaveAttribute('href', '/register');
    }
  });

  it('đưa người đã đăng nhập vào app', () => {
    setSessionMarker();
    render(<LandingPage />);

    expect(screen.getByRole('link', { name: 'Trang của tôi' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(screen.getAllByRole('link', { name: 'Vào học tiếp' })).toHaveLength(2);
    expect(screen.queryByRole('link', { name: 'Tạo tài khoản' })).not.toBeInTheDocument();
  });
});
