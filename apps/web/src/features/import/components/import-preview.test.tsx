import type { ImportRow } from '@vocab/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ImportPreview } from './import-preview';

const ROWS: ImportRow[] = [
  { line: 1, term: 'apple', definition: 'quả táo', errors: [] },
  { line: 2, term: 'chỉ có từ', definition: '', errors: ['Hãy nhập định nghĩa'] },
  { line: 4, term: 'cat', definition: 'con mèo', errors: [] },
];

const NO_EXTRA = { phonetic: false, example: false };

function Harness({ initial = ROWS, columns = NO_EXTRA }: HarnessProps) {
  const [rows, setRows] = useState(initial);
  return <ImportPreview rows={rows} columns={columns} onChange={setRows} />;
}

interface HarnessProps {
  initial?: ImportRow[];
  columns?: { phonetic: boolean; example: boolean };
}

describe('ImportPreview', () => {
  it('mặc định chỉ hiện dòng lỗi, bỏ chọn thì hiện tất cả', async () => {
    render(<Harness />);

    expect(screen.getByText('1 dòng cần sửa hoặc bỏ trước khi lưu.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('Hãy nhập định nghĩa')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Chỉ hiện dòng lỗi'));

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('sửa dòng lỗi thì lỗi biến mất và kiểm tra lại theo schema', async () => {
    render(<Harness />);
    const row = screen.getByRole('listitem', { name: 'Dòng 2' });

    await userEvent.type(within(row).getByLabelText('Nghĩa'), 'nghĩa mới');

    expect(screen.getByText('Mọi dòng đều hợp lệ.')).toBeInTheDocument();
    expect(screen.queryByText('Hãy nhập định nghĩa')).not.toBeInTheDocument();

    await userEvent.clear(within(row).getByLabelText('Từ'));
    expect(within(row).getByText('Hãy nhập thuật ngữ')).toBeInTheDocument();
  });

  it('chỉ hiện phiên âm, ví dụ khi có chọn cột và kiểm tra độ dài', async () => {
    const rows = [{ line: 1, term: 'apple', definition: 'quả táo', phonetic: '', errors: [] }];
    const { unmount } = render(<Harness initial={rows} />);
    expect(screen.queryByLabelText('Phiên âm')).not.toBeInTheDocument();
    unmount();

    render(<Harness initial={rows} columns={{ phonetic: true, example: false }} />);
    const phonetic = screen.getByLabelText('Phiên âm');
    expect(screen.queryByLabelText('Ví dụ')).not.toBeInTheDocument();

    await userEvent.click(phonetic);
    await userEvent.paste('a'.repeat(201));
    expect(screen.getByText('phiên âm tối đa 200 ký tự')).toBeInTheDocument();

    await userEvent.clear(phonetic);
    expect(screen.getByText('Mọi dòng đều hợp lệ.')).toBeInTheDocument();
  });

  it('bỏ dòng khỏi danh sách', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Bỏ dòng 2' }));

    expect(screen.getByRole('heading', { name: 'Xem trước (2 thẻ)' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
