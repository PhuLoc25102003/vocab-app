import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ImportPreviewResult } from '@vocab/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { previewImport } from '../api';
import { ImportSource } from './import-source';

vi.mock('../api');

const result: ImportPreviewResult = {
  delimiter: 'comma',
  columnCount: 2,
  rows: [{ line: 2, term: 'apple', definition: 'quả táo', errors: [] }],
};

function renderSource() {
  const onPreview = vi.fn();
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ImportSource onPreview={onPreview} />
    </QueryClientProvider>,
  );
  return onPreview;
}

const previewButton = () => screen.getByRole('button', { name: 'Xem trước' });

describe('ImportSource', () => {
  beforeEach(() => vi.clearAllMocks());

  it('gửi text đã dán cùng cách đọc và trả kết quả xem trước', async () => {
    vi.mocked(previewImport).mockResolvedValue(result);
    const onPreview = renderSource();

    await userEvent.type(screen.getByLabelText('Dán danh sách từ'), 'Từ,Nghĩa{enter}apple,quả táo');
    await userEvent.selectOptions(screen.getByLabelText('Ký tự phân cách'), 'comma');
    await userEvent.click(screen.getByLabelText('Dòng đầu là tiêu đề, bỏ qua khi nhập'));
    await userEvent.click(previewButton());

    await waitFor(() =>
      expect(onPreview).toHaveBeenCalledWith(result, { phonetic: false, example: false }),
    );
    expect(vi.mocked(previewImport).mock.calls[0]?.[0]).toEqual({
      content: 'Từ,Nghĩa\napple,quả táo',
      options: { delimiter: 'comma', hasHeader: true, termColumn: 1, definitionColumn: 2 },
    });
  });

  it('gửi cột phiên âm và ví dụ khi được chọn', async () => {
    vi.mocked(previewImport).mockResolvedValue(result);
    const onPreview = renderSource();

    await userEvent.type(screen.getByLabelText('Dán danh sách từ'), 'a	b	c	d');
    await userEvent.selectOptions(screen.getByLabelText('Cột phiên âm (không bắt buộc)'), '3');
    await userEvent.selectOptions(screen.getByLabelText('Cột ví dụ (không bắt buộc)'), '4');
    await userEvent.click(previewButton());

    await waitFor(() =>
      expect(onPreview).toHaveBeenCalledWith(result, { phonetic: true, example: true }),
    );
    expect(vi.mocked(previewImport).mock.calls[0]?.[0].options).toMatchObject({
      phoneticColumn: 3,
      exampleColumn: 4,
    });
  });

  it('báo lỗi khi cột phiên âm trùng cột khác', async () => {
    renderSource();

    await userEvent.type(screen.getByLabelText('Dán danh sách từ'), 'a	b');
    await userEvent.selectOptions(screen.getByLabelText('Cột phiên âm (không bắt buộc)'), '2');
    await userEvent.click(previewButton());

    expect(
      await screen.findByText('Cột phiên âm phải khác cột từ và cột nghĩa'),
    ).toBeInTheDocument();
    expect(previewImport).not.toHaveBeenCalled();
  });

  it('báo lỗi khi chưa có nội dung hoặc chọn hai cột giống nhau', async () => {
    renderSource();

    await userEvent.selectOptions(screen.getByLabelText('Cột nghĩa'), '1');
    await userEvent.click(previewButton());

    expect(await screen.findByText('Hãy dán nội dung hoặc chọn file')).toBeInTheDocument();
    expect(screen.getByText('Cột nghĩa phải khác cột từ')).toBeInTheDocument();
    expect(previewImport).not.toHaveBeenCalled();
  });

  it('đọc file đã chọn vào ô nội dung', async () => {
    renderSource();
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');

    await userEvent.upload(input!, new File(['cat\tcon mèo'], 'tu.txt', { type: 'text/plain' }));

    await waitFor(() =>
      expect(screen.getByLabelText('Dán danh sách từ')).toHaveValue('cat\tcon mèo'),
    );
    expect(screen.getByText('Đã đọc tu.txt')).toBeInTheDocument();
  });

  it('báo lỗi file Excel và lỗi từ máy chủ', async () => {
    vi.mocked(previewImport).mockRejectedValue(
      new HttpError('Mỗi lần nhập tối đa 2000 dòng', 422, 'IMPORT_TOO_MANY_ROWS'),
    );
    renderSource();
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');

    await userEvent.upload(input!, new File(['x'], 'tu.xlsx', { type: '' }), {
      applyAccept: false,
    });
    expect(await screen.findByText(/Chưa đọc được file Excel/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Dán danh sách từ'), 'a\tb');
    await userEvent.click(previewButton());
    expect(await screen.findByText('Mỗi lần nhập tối đa 2000 dòng')).toBeInTheDocument();
  });
});
