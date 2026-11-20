import 'fake-indexeddb/auto';
import type { SetDetail } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { clearOfflineData, saveOfflineSet } from '@/lib/offline-store';
import { OfflineNotice } from './offline-notice';

describe('OfflineNotice', () => {
  afterEach(() => clearOfflineData());

  it('liệt kê bộ từ đã tải và mở ra xem được thẻ', async () => {
    await saveOfflineSet({
      id: 's1',
      title: 'Trái cây',
      termLang: 'en',
      defLang: 'vi',
      cards: [{ id: 'c1', term: 'apple', definition: 'quả táo' }],
    } as unknown as SetDetail);
    render(<OfflineNotice />);

    expect(screen.getByRole('heading', { name: 'Bạn đang offline' })).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Trái cây'));
    expect(screen.getByText('quả táo')).toBeVisible();
  });

  it('không có bộ đã tải thì chỉ hiện thông báo', async () => {
    render(<OfflineNotice />);

    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Bộ từ đã tải về máy' })).not.toBeInTheDocument();
  });
});
