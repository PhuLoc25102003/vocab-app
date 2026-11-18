import type { AuthUser, Role } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../store';
import { Can } from './can';

const userWith = (role: Role): AuthUser => ({
  id: 'u1',
  email: 'an@example.com',
  displayName: 'An',
  role,
});
const signIn = (role: Role) =>
  useAuthStore.setState({ status: 'authenticated', user: userWith(role) });

describe('Can', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'anonymous', user: null, accessToken: null });
  });

  it('ẩn nội dung với khách và hiện fallback', () => {
    render(
      <Can action="update" resource={{ ownerId: 'u1' }} fallback="Không có quyền">
        Sửa
      </Can>,
    );

    expect(screen.queryByText('Sửa')).not.toBeInTheDocument();
    expect(screen.getByText('Không có quyền')).toBeInTheDocument();
  });

  it('chỉ hiện với chủ tài nguyên hoặc ADMIN', () => {
    signIn('STUDENT');
    const { rerender } = render(
      <Can action="delete" resource={{ ownerId: 'u1' }}>
        Xoá
      </Can>,
    );
    expect(screen.getByText('Xoá')).toBeInTheDocument();

    rerender(
      <Can action="delete" resource={{ ownerId: 'u2' }}>
        Xoá
      </Can>,
    );
    expect(screen.queryByText('Xoá')).not.toBeInTheDocument();
  });

  it('ADMIN được sửa tài nguyên của người khác', () => {
    signIn('ADMIN');
    render(
      <Can action="update" resource={{ ownerId: 'u2' }}>
        Sửa
      </Can>,
    );
    expect(screen.getByText('Sửa')).toBeInTheDocument();
  });

  it('kiểm tra theo vai trò', () => {
    signIn('TEACHER');
    render(
      <>
        <Can action="manage-classes">Lớp học</Can>
        <Can action="manage-users">Người dùng</Can>
      </>,
    );
    expect(screen.getByText('Lớp học')).toBeInTheDocument();
    expect(screen.queryByText('Người dùng')).not.toBeInTheDocument();
  });
});
