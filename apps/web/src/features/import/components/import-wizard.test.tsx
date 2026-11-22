import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ImportPreviewResult } from '@vocab/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { getImportTarget, importAsNewSet, importIntoSet, previewImport } from '../api';
import { ImportWizard } from './import-wizard';

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => navigation }));
vi.mock('../api');

const preview: ImportPreviewResult = {
  delimiter: 'tab',
  columnCount: 2,
  rows: [
    { line: 1, term: 'apple', definition: 'quả táo', errors: [] },
    { line: 2, term: 'cat', definition: '', errors: ['Hãy nhập định nghĩa'] },
  ],
};

function renderWizard(setId?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ImportWizard setId={setId} />
    </QueryClientProvider>,
  );
}

async function goToPreview() {
  await userEvent.type(screen.getByLabelText('Dán danh sách từ'), 'apple\tquả táo');
  await userEvent.click(screen.getByRole('button', { name: 'Xem trước' }));
  await screen.findByRole('heading', { level: 2, name: /^Thẻ/ });
}

describe('ImportWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(previewImport).mockResolvedValue(preview);
  });

  it('chặn lưu khi còn dòng lỗi, sửa xong thì tạo bộ mới và tới trang bộ từ', async () => {
    vi.mocked(importAsNewSet).mockResolvedValue('s9');
    renderWizard();
    await goToPreview();
    const saveButton = screen.getByRole('button', { name: 'Lưu 2 thẻ' });

    // Dòng 2 đang thiếu định nghĩa
    await userEvent.type(screen.getByLabelText('Tên bộ từ'), 'Động vật');
    await userEvent.click(saveButton);
    expect(importAsNewSet).not.toHaveBeenCalled();

    const defInputs = screen.getAllByLabelText('Nghĩa');
    await userEvent.type(defInputs[1]!, 'con mèo');
    await userEvent.click(saveButton);

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/sets/s9'));
    expect(importAsNewSet).toHaveBeenCalledWith({
      title: 'Động vật',
      visibility: 'PRIVATE',
      cards: [
        { term: 'apple', definition: 'quả táo' },
        { term: 'cat', definition: 'con mèo' },
      ],
    });
  });

  it('lưu phiên âm và ví dụ khi có chọn cột, ô trống thì bỏ qua', async () => {
    vi.mocked(previewImport).mockResolvedValue({
      delimiter: 'tab',
      columnCount: 4,
      rows: [
        {
          line: 1,
          term: 'apple',
          definition: 'quả táo',
          phonetic: '/ˈæp.əl/',
          example: '',
          errors: [],
        },
      ],
    });
    vi.mocked(importAsNewSet).mockResolvedValue('s9');
    renderWizard();
    await userEvent.type(screen.getByLabelText('Dán danh sách từ'), 'apple	quả táo');
    await userEvent.click(screen.getByRole('button', { name: 'Xem trước' }));

    expect(await screen.findByLabelText(/Phiên âm/)).toHaveValue('/ˈæp.əl/');
    await userEvent.type(screen.getByLabelText(/Ví dụ/), 'I eat an apple.');
    await userEvent.type(screen.getByLabelText('Tên bộ từ'), 'Trái cây');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu 1 thẻ' }));

    await waitFor(() => expect(importAsNewSet).toHaveBeenCalled());
    expect(vi.mocked(importAsNewSet).mock.calls[0]?.[0].cards).toStrictEqual([
      { term: 'apple', definition: 'quả táo', phonetic: '/ˈæp.əl/', example: 'I eat an apple.' },
    ]);
  });

  it('yêu cầu tên khi tạo bộ mới', async () => {
    vi.mocked(previewImport).mockResolvedValue({ ...preview, rows: [preview.rows[0]!] });
    renderWizard();
    await goToPreview().catch(() => undefined);
    await userEvent.click(await screen.findByRole('button', { name: 'Lưu 1 thẻ' }));

    expect(await screen.findByText('Hãy nhập tên bộ từ')).toBeInTheDocument();
    expect(importAsNewSet).not.toHaveBeenCalled();
  });

  it('thêm vào bộ có sẵn và báo lỗi vượt giới hạn từ máy chủ', async () => {
    vi.mocked(getImportTarget).mockResolvedValue({ id: 's1', title: 'Trái cây', cardCount: 1999 });
    vi.mocked(previewImport).mockResolvedValue({
      ...preview,
      rows: [preview.rows[0]!, preview.rows[0]!],
    });
    vi.mocked(importIntoSet).mockRejectedValue(
      new HttpError('Bộ từ đang có 1999 thẻ, chỉ thêm được 1 thẻ nữa', 422, 'SET_CARD_LIMIT'),
    );
    renderWizard('s1');

    expect(await screen.findByText(/cuối bộ “Trái cây”, bộ đang có 1999 thẻ/)).toBeInTheDocument();
    await goToPreview();
    await userEvent.click(screen.getByRole('button', { name: 'Lưu 2 thẻ' }));

    expect(await screen.findByText(/chỉ thêm được 1 thẻ nữa/)).toBeInTheDocument();
    expect(importIntoSet).toHaveBeenCalledWith('s1', [
      { term: 'apple', definition: 'quả táo' },
      { term: 'apple', definition: 'quả táo' },
    ]);
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('báo không tìm thấy khi bộ từ không còn', async () => {
    vi.mocked(getImportTarget).mockRejectedValue(new HttpError('x', 404, 'SET_NOT_FOUND'));
    renderWizard('gone');

    expect(
      await screen.findByRole('heading', { name: 'Không tìm thấy bộ từ' }),
    ).toBeInTheDocument();
  });

  it('cho phép nhập lại bằng nút Nhập lại', async () => {
    renderWizard();
    await goToPreview();

    await userEvent.click(screen.getByRole('button', { name: 'Nhập lại' }));

    expect(screen.getByLabelText('Dán danh sách từ')).toBeInTheDocument();
  });
});
