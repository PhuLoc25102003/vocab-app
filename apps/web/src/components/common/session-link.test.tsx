import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { clearSessionMarker, setSessionMarker } from '@/lib/session-marker';
import { SessionLink } from './session-link';

const renderLink = () =>
  render(
    <SessionLink
      guest={{ href: '/login', label: 'Đăng nhập' }}
      member={{ href: '/dashboard', label: 'Về trang của tôi' }}
    />,
  );

describe('SessionLink', () => {
  afterEach(clearSessionMarker);

  it('mời khách đăng nhập', () => {
    renderLink();

    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login');
  });

  it('đưa người có phiên vào app', () => {
    setSessionMarker();
    renderLink();

    expect(screen.getByRole('link', { name: 'Về trang của tôi' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });
});
