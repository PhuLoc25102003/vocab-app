import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from '@/components/ui/button';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingState } from './loading-state';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('hiện tiêu đề cấp 1, mô tả và hành động', () => {
    render(
      <PageHeader title="Bộ từ" description="Mọi bộ từ của bạn" actions={<Button>Tạo</Button>} />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Bộ từ' })).toBeInTheDocument();
    expect(screen.getByText('Mọi bộ từ của bạn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tạo' })).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('hiện tình trạng và hành động chính', () => {
    render(<EmptyState title="Chưa có bộ từ nào" action={<Button>Tạo bộ từ</Button>} />);

    expect(screen.getByRole('heading', { name: 'Chưa có bộ từ nào' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tạo bộ từ' })).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('báo lỗi và thử lại khi bấm nút', async () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Không tải được" description="Kiểm tra mạng." onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Không tải được');
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('không hiện nút khi không thử lại được', () => {
    render(<ErrorState title="Không tải được" description="Kiểm tra mạng." />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('LoadingState', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('chỉ báo máy chủ khởi động sau 3 giây', () => {
    vi.useFakeTimers();
    render(<LoadingState label="Đang tải bộ từ">nội dung</LoadingState>);
    const message = /Máy chủ đang khởi động/;

    expect(screen.getByRole('status', { name: 'Đang tải bộ từ' })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2_999);
    });
    expect(screen.queryByText(message)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText(message)).toBeInTheDocument();
  });
});
