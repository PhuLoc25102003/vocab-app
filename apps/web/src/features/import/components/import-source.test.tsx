import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ImportPreviewResult } from '@vocab/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { buildXlsx } from '@/lib/xlsx';
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
const openOptions = () => userEvent.click(screen.getByRole('button', { name: 'Đổi cách đọc' }));
const DELIMITER = 'Từ và nghĩa cách nhau bằng';

describe('ImportSource', () => {
  beforeEach(() => vi.clearAllMocks());

  it('gửi text đã dán cùng cách đọc và trả kết quả xem trước', async () => {
    vi.mocked(previewImport).mockResolvedValue(result);
    const onPreview = renderSource();

    await userEvent.type(screen.getByLabelText('Dán danh sách từ'), 'Từ,Nghĩa{enter}apple,quả táo');
    await openOptions();
    await userEvent.selectOptions(screen.getByLabelText(DELIMITER), 'comma');
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
    await openOptions();
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
    await openOptions();
    await userEvent.selectOptions(screen.getByLabelText('Cột phiên âm (không bắt buộc)'), '2');
    await userEvent.click(previewButton());

    expect(
      await screen.findByText('Cột phiên âm phải khác cột từ và cột nghĩa'),
    ).toBeInTheDocument();
    expect(previewImport).not.toHaveBeenCalled();
  });

  it('báo lỗi khi chưa có nội dung hoặc chọn hai cột giống nhau', async () => {
    renderSource();

    await openOptions();
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

  it('đọc file Excel vào ô nội dung và chọn tab làm ký tự phân cách', async () => {
    renderSource();
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    const workbook = buildXlsx([[['apple', 'quả táo']]]);

    await userEvent.upload(input!, new File([workbook as BlobPart], 'tu.xlsx', { type: '' }));

    await waitFor(() =>
      expect(screen.getByLabelText('Dán danh sách từ')).toHaveValue('apple	quả táo'),
    );
    await openOptions();
    expect(screen.getByLabelText(DELIMITER)).toHaveValue('tab');
    expect(screen.getByText('Đã đọc tu.xlsx')).toBeInTheDocument();
  });

  it('nhận ra file mẫu đã điền và chọn sẵn cột, vẫn đổi lại được', async () => {
    renderSource();
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    const workbook = buildXlsx([
      [
        ['Ví dụ', 'Từ', 'Nghĩa', 'Phiên âm'],
        [null, 'cat', 'con mèo', null],
      ],
    ]);

    await userEvent.upload(input!, new File([workbook as BlobPart], 'mau.xlsx', { type: '' }));

    expect(
      await screen.findByText('Đã nhận ra tiêu đề file mẫu, các cột được chọn sẵn.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Cách nhau bằng phím Tab. Lấy từ ở cột 2, nghĩa ở cột 3, phiên âm ở cột 4, ví dụ ở cột 1, bỏ dòng tiêu đề.',
      ),
    ).toBeInTheDocument();
    await openOptions();
    expect(screen.getByLabelText('Dòng đầu là tiêu đề, bỏ qua khi nhập')).toBeChecked();
    expect(screen.getByLabelText('Cột từ')).toHaveValue('2');
    expect(screen.getByLabelText('Cột nghĩa')).toHaveValue('3');
    expect(screen.getByLabelText('Cột phiên âm (không bắt buộc)')).toHaveValue('4');
    expect(screen.getByLabelText('Cột ví dụ (không bắt buộc)')).toHaveValue('1');

    await userEvent.selectOptions(screen.getByLabelText('Cột ví dụ (không bắt buộc)'), '');
    expect(screen.getByLabelText('Cột ví dụ (không bắt buộc)')).toHaveValue('');
  });

  it('dán nội dung có tiêu đề mẫu vào ô trống thì chọn sẵn cột', async () => {
    renderSource();
    const textarea = screen.getByLabelText('Dán danh sách từ');

    await userEvent.click(textarea);
    const pasted = 'Từ,Nghĩa,Ví dụ\napple,quả táo,An apple.';
    await userEvent.paste(pasted);

    expect(textarea).toHaveValue(pasted);
    await openOptions();
    expect(screen.getByLabelText(DELIMITER)).toHaveValue('comma');
    expect(screen.getByLabelText('Cột ví dụ (không bắt buộc)')).toHaveValue('3');
    expect(screen.getByLabelText('Cột phiên âm (không bắt buộc)')).toHaveValue('');
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
    expect(await screen.findByText(/File Excel bị hỏng/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Dán danh sách từ'), 'a\tb');
    await userEvent.click(previewButton());
    expect(await screen.findByText('Mỗi lần nhập tối đa 2000 dòng')).toBeInTheDocument();
  });

  it('chưa có nội dung thì tóm tắt cách đọc mặc định, mở ra thấy các lựa chọn có ví dụ', async () => {
    renderSource();

    expect(
      screen.getByText(
        'Trang tự nhận cách ngăn cách sau khi bạn dán hoặc chọn file. Lấy từ ở cột 1, nghĩa ở cột 2.',
      ),
    ).toBeInTheDocument();
    await openOptions();
    expect(screen.getByRole('option', { name: 'Dấu phẩy: apple, quả táo' })).toBeInTheDocument();
    expect(screen.getByLabelText('Cột từ')).toHaveDisplayValue('Cột 1');
  });

  it('nhãn cột hiện giá trị dòng đầu và báo ký tự đã tự nhận', async () => {
    renderSource();

    await userEvent.type(screen.getByLabelText('Dán danh sách từ'), 'apple - quả táo');
    await openOptions();

    expect(screen.getByText('Đã nhận: gạch ngang.')).toBeInTheDocument();
    expect(screen.getByLabelText('Cột từ')).toHaveDisplayValue('Cột 1: apple');
    expect(screen.getByLabelText('Cột nghĩa')).toHaveDisplayValue('Cột 2: quả táo');
    expect(screen.getAllByRole('option', { name: 'Cột 3' }).length).toBeGreaterThan(0);
  });

  it('chỉ tách được một cột thì báo và mở sẵn cách đọc', async () => {
    renderSource();

    await userEvent.type(screen.getByLabelText('Dán danh sách từ'), 'apple quả táo');

    expect(screen.getByText(/Chưa tách được từ và nghĩa/)).toBeInTheDocument();
    expect(screen.getByLabelText(DELIMITER)).toHaveValue('auto');
    expect(screen.queryByRole('button', { name: 'Đổi cách đọc' })).not.toBeInTheDocument();
  });
});
