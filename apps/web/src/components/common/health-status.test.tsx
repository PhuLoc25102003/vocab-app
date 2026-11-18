import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/lib/http';
import { HealthStatus } from './health-status';

vi.mock('@/lib/http', () => ({ http: vi.fn() }));

function renderStatus() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <HealthStatus />
    </QueryClientProvider>,
  );
}

describe('HealthStatus', () => {
  beforeEach(() => {
    vi.mocked(http).mockReset();
  });

  it('hiện trạng thái đang kiểm tra', () => {
    vi.mocked(http).mockReturnValue(new Promise(() => undefined));
    renderStatus();
    expect(screen.getByRole('status')).toHaveTextContent('Đang kiểm tra API');
  });

  it('hiện kết quả khi API hoạt động', async () => {
    vi.mocked(http).mockResolvedValue({ status: 'ok', db: 'up' });
    renderStatus();
    expect(await screen.findByText('API: ok · Database: up')).toBeInTheDocument();
    expect(http).toHaveBeenCalledWith('/health');
  });

  it('hiện lỗi khi không gọi được API', async () => {
    vi.mocked(http).mockRejectedValue(new Error('Mất kết nối'));
    renderStatus();
    expect(await screen.findByText(/Không kiểm tra được API: Mất kết nối/)).toBeInTheDocument();
  });

  it('hiện lỗi khi API trả sai định dạng', async () => {
    vi.mocked(http).mockResolvedValue({ status: 'down' });
    renderStatus();
    expect(await screen.findByText(/Không kiểm tra được API/)).toBeInTheDocument();
  });
});
