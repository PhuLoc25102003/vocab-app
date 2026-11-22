import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminNavTabs } from './admin-nav-tabs';

describe('AdminNavTabs', () => {
  it('hiển thị đầy đủ 3 tab quản trị và đánh dấu tab hiện tại', () => {
    render(<AdminNavTabs current="users" />);

    const usersLink = screen.getByRole('link', { name: /Người dùng/i });
    const hiddenSetsLink = screen.getByRole('link', { name: /Bộ từ bị ẩn/i });
    const classesLink = screen.getByRole('link', { name: /Lớp học & Học sinh/i });

    expect(usersLink).toBeInTheDocument();
    expect(usersLink).toHaveAttribute('aria-current', 'page');
    expect(usersLink).toHaveAttribute('href', '/admin/users');

    expect(hiddenSetsLink).toBeInTheDocument();
    expect(hiddenSetsLink).not.toHaveAttribute('aria-current');
    expect(hiddenSetsLink).toHaveAttribute('href', '/admin/hidden-sets');

    expect(classesLink).toBeInTheDocument();
    expect(classesLink).not.toHaveAttribute('aria-current');
    expect(classesLink).toHaveAttribute('href', '/admin/classes');
  });

  it('đánh dấu đúng tab khi current là hidden-sets hoặc classes', () => {
    const { rerender } = render(<AdminNavTabs current="hidden-sets" />);
    expect(screen.getByRole('link', { name: /Bộ từ bị ẩn/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: /Người dùng/i })).not.toHaveAttribute('aria-current');

    rerender(<AdminNavTabs current="classes" />);
    expect(screen.getByRole('link', { name: /Lớp học & Học sinh/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
