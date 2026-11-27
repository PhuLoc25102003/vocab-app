import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearSessionMarker, setSessionMarker } from '@/lib/session-marker';
import { LandingPage } from './landing-page';

vi.mock('@/components/common/theme-toggle', () => ({ ThemeToggle: () => null }));
vi.mock('@/components/common/language-switcher', () => ({ LanguageToggle: () => null }));

describe('LandingPage', () => {
  afterEach(clearSessionMarker);

  it('giới thiệu sản phẩm, đủ mười chế độ học, trò chơi và lịch ôn', () => {
    render(<LandingPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('ôn đúng lúc');
    expect(screen.getByRole('heading', { name: /Lịch ôn tự giãn/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Một nút, mười bước' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bảng xếp hạng tuần' })).toBeInTheDocument();
    for (const mode of [
      'Flashcard',
      'Học kỹ',
      'Viết',
      'Nghe viết',
      'Trắc nghiệm',
      'Luyện nói',
      'Mưa từ',
    ]) {
      expect(screen.getAllByText(mode).length).toBeGreaterThan(0);
    }
  });

  it('mời khách tạo tài khoản', () => {
    render(<LandingPage />);

    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Khám phá bộ từ' })).toHaveAttribute(
      'href',
      '/explore',
    );
    for (const link of screen.getAllByRole('link', { name: 'Tạo tài khoản' })) {
      expect(link).toHaveAttribute('href', '/register');
    }
  });

  it('có link tới chính sách bảo mật và điều khoản ở chân trang', () => {
    render(<LandingPage />);

    const legal = screen.getByRole('navigation', { name: 'Thông tin pháp lý' });
    expect(within(legal).getByRole('link', { name: 'Chính sách bảo mật' })).toHaveAttribute(
      'href',
      '/privacy',
    );
    expect(within(legal).getByRole('link', { name: 'Điều khoản sử dụng' })).toHaveAttribute(
      'href',
      '/terms',
    );
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
