import { act, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it } from 'vitest';
import { Toaster } from './toaster';

describe('Toaster', () => {
  afterEach(() => {
    toast.dismiss();
  });

  it('hiện thông báo được gọi từ toast()', async () => {
    render(<Toaster />);

    act(() => {
      toast.success('Đã lưu bộ từ');
    });

    expect(await screen.findByText('Đã lưu bộ từ')).toBeInTheDocument();
  });
});
