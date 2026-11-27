import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Combobox, normalizeSearch } from './combobox';

const options = [
  { value: 'en', label: 'Tiếng Anh' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'ja', label: 'Tiếng Nhật' },
];

function Harness({ debounceMs }: { debounceMs?: number }) {
  const [value, setValue] = useState('en');
  return (
    <>
      <Combobox
        label="Ngôn ngữ"
        options={[...options, { value: 'ko', label: 'Hàn Quốc', keywords: 'Korean' }]}
        value={value}
        onChange={setValue}
        debounceMs={debounceMs}
      />
      <output>{value}</output>
    </>
  );
}

describe('normalizeSearch', () => {
  it('bỏ dấu, đ thành d, chữ thường', () => {
    expect(normalizeSearch('  Tiếng Việt Đẹp ')).toBe('tieng viet dep');
  });
});

describe('Combobox', () => {
  it('tìm được theo từ khoá ẩn và chờ ngừng gõ rồi mới lọc khi có debounce', async () => {
    render(<Harness debounceMs={200} />);
    const input = screen.getByRole('combobox', { name: 'Ngôn ngữ' });
    await userEvent.click(input);
    await userEvent.keyboard('korean');
    // Chưa hết thời gian chờ: danh sách vẫn là danh sách cũ.
    expect(screen.getAllByRole('option')).toHaveLength(4);
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
    expect(screen.getByRole('option', { name: 'Hàn Quốc' })).toBeInTheDocument();
  });

  it('bấm Enter trước khi hết thời gian chờ vẫn chọn theo chữ vừa gõ', async () => {
    render(<Harness debounceMs={1000} />);
    const input = screen.getByRole('combobox', { name: 'Ngôn ngữ' });
    await userEvent.click(input);
    await userEvent.keyboard('nhat{Enter}');
    expect(screen.getByText('ja', { selector: 'output' })).toBeInTheDocument();
  });

  it('gõ không dấu để lọc ngay trong ô, Enter chọn mục đang trỏ', async () => {
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Ngôn ngữ' });
    expect(input).toHaveValue('Tiếng Anh');

    await userEvent.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('viet');
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
    await userEvent.keyboard('{Enter}');

    expect(screen.getByText('vi', { selector: 'output' })).toBeInTheDocument();
    expect(input).toHaveValue('Tiếng Việt');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('phím mũi tên đổi mục, Esc đóng và giữ giá trị cũ', async () => {
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Ngôn ngữ' });
    input.focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    expect(input.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Tiếng Việt' }).id,
    );
    await userEvent.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('en', { selector: 'output' })).toBeInTheDocument();
  });

  it('không có mục khớp thì báo', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('combobox', { name: 'Ngôn ngữ' }));
    await userEvent.keyboard('xyz');
    expect(await screen.findByText('Không có kết quả')).toBeInTheDocument();
  });
});
