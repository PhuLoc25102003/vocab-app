import 'fake-indexeddb/auto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SetDetail } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearOfflineData, saveOfflineSet } from '@/lib/offline-store';
import { OfflineStudyButton } from './offline-study';

const mockSet: SetDetail = {
  id: 'set-offline-1',
  title: 'Bộ từ Animal',
  description: 'Mô tả',
  visibility: 'PUBLIC',
  cardCount: 2,
  ownerId: 'u1',
  owner: { displayName: 'User' },
  createdAt: '2026-11-20T00:00:00.000Z',
  updatedAt: '2026-11-20T00:00:00.000Z',
  termLang: 'en',
  defLang: 'vi',
  cards: [
    {
      id: 'c1',
      position: 0,
      term: 'cat',
      definition: 'con mèo',
      phonetic: null,
      example: null,
      imageUrl: null,
      audioUrl: null,
    },
    {
      id: 'c2',
      position: 1,
      term: 'dog',
      definition: 'con chó',
      phonetic: null,
      example: null,
      imageUrl: null,
      audioUrl: null,
    },
  ],
};

function renderComponent(set: SetDetail = mockSet) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <OfflineStudyButton setId={set.id} set={set} />
    </QueryClientProvider>,
  );
}

describe('OfflineStudyButton', () => {
  beforeEach(async () => {
    await clearOfflineData();
    await saveOfflineSet(mockSet);
  });

  afterEach(async () => {
    await clearOfflineData();
  });

  it('hiển thị nút "Học offline" và nút "Chọn chế độ"', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: 'Học offline' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn chế độ' })).toBeInTheDocument();
  });

  it('bấm "Học offline" vào thẳng chế độ Flashcard', async () => {
    renderComponent();
    await userEvent.click(screen.getByRole('button', { name: 'Học offline' }));

    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xem nghĩa/i })).toBeInTheDocument();
  });

  it('bấm "Chọn chế độ" mở hộp thoại hiển thị danh sách các chế độ học', async () => {
    renderComponent();
    await userEvent.click(screen.getByRole('button', { name: 'Chọn chế độ' }));

    expect(
      await screen.findByRole('heading', { name: 'Chọn chế độ học offline' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Trắc nghiệm/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Flashcard/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Nghe viết/ })).toBeInTheDocument();
  });

  it('chọn chế độ Trắc nghiệm thì bắt đầu học với câu hỏi trắc nghiệm', async () => {
    renderComponent();
    await userEvent.click(screen.getByRole('button', { name: 'Chọn chế độ' }));

    const mcqButton = await screen.findByRole('button', { name: /^Trắc nghiệm/ });
    await userEvent.click(mcqButton);

    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });

  it('bấm nút X thoát khi đang học quay lại màn hình chọn chế độ mượt mà', async () => {
    renderComponent();
    await userEvent.click(screen.getByRole('button', { name: 'Học offline' }));

    const exitBtn = await screen.findByRole('button', { name: 'Thoát phiên học' });
    await userEvent.click(exitBtn);

    expect(await screen.findByRole('button', { name: 'Học offline' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn chế độ' })).toBeInTheDocument();
  });

  it('học xong có nút "Về danh sách tải về", bấm vào đóng phiên học trở về danh sách', async () => {
    renderComponent();
    await userEvent.click(screen.getByRole('button', { name: 'Học offline' }));

    // Trả lời 2 thẻ Flashcard
    for (let i = 0; i < 2; i += 1) {
      await userEvent.click(await screen.findByRole('button', { name: /Xem nghĩa/i }));
      await userEvent.click(await screen.findByRole('button', { name: /Đã nhớ/i }));
    }

    // Kết quả hiện ra với nút "Về danh sách tải về"
    const backBtn = await screen.findByRole('button', { name: 'Về danh sách tải về' });
    expect(backBtn).toBeInTheDocument();

    // Bấm về danh sách tải về không bị đơ, quay lại trang offline
    await userEvent.click(backBtn);
    expect(await screen.findByRole('button', { name: 'Học offline' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn chế độ' })).toBeInTheDocument();
  });
});
