import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ListNoMatch, ListPager, ListPanel, ListToolbar } from './list-panel';

describe('ListPanel', () => {
  it('khung có tiêu đề kèm tổng số, tab trong URL, ô tìm gửi khi Enter', async () => {
    const onSearch = vi.fn();
    render(
      <ListPanel
        title="Bài tập"
        count={128}
        toolbar={
          <ListToolbar
            tabs={[
              { label: 'Cần làm', href: '/classes', current: true, count: 6 },
              { label: 'Đã nộp', href: '/classes?group=done', current: false },
            ]}
            search={{ label: 'Tìm theo tên bộ', value: '', onSearch }}
          />
        }
        footer={
          <ListPager
            page={2}
            pageSize={20}
            total={128}
            hrefFor={(page) => `/classes?page=${page}`}
          />
        }
      >
        <p>Nội dung</p>
      </ListPanel>,
    );

    expect(screen.getByRole('region', { name: /Bài tập/ })).toHaveTextContent('128');
    expect(screen.getByRole('link', { name: 'Cần làm (6)' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Tìm theo tên bộ' }),
      ' unit {enter}',
    );
    expect(onSearch).toHaveBeenCalledWith('unit');
    expect(screen.getByText('21–40 trên 128')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Trang sau' })).toHaveAttribute(
      'href',
      '/classes?page=3',
    );
  });

  it('không khớp bộ lọc thì cho xoá bộ lọc', () => {
    render(<ListNoMatch text="Không có bài nào khớp" clearHref="/classes" />);
    expect(screen.getByRole('link', { name: 'Xoá bộ lọc' })).toHaveAttribute('href', '/classes');
  });
});
