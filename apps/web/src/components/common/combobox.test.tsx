import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Combobox, normalizeSearch } from './combobox';

const options = [
  { value: 'en', label: 'Tiếng Anh' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'ja', label: 'Tiếng Nhật' },
];

function Harness() {
  const [value, setValue] = useState('en');
  return (
    <>
      <Combobox label="Ngôn ngữ" options={options} value={value} onChange={setValue} />
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
  it('gõ không dấu để lọc ngay trong ô, Enter chọn mục đang trỏ', async () => {
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Ngôn ngữ' });
    expect(input).toHaveValue('Tiếng Anh');

    await userEvent.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('viet');
    expect(screen.getAllByRole('option')).toHaveLength(1);
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
    expect(screen.getByText('Không có kết quả')).toBeInTheDocument();
  });
});
