import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../store';
import { SignedIn } from './signed-in';

describe('SignedIn', () => {
  afterEach(() => useAuthStore.setState({ status: 'loading' }));

  it('chỉ hiện nội dung khi đã đăng nhập', () => {
    useAuthStore.setState({ status: 'loading' });
    const { rerender } = render(<SignedIn>chuông</SignedIn>);
    expect(screen.queryByText('chuông')).not.toBeInTheDocument();

    useAuthStore.setState({ status: 'authenticated' });
    rerender(<SignedIn>chuông</SignedIn>);
    expect(screen.getByText('chuông')).toBeInTheDocument();
  });
});
