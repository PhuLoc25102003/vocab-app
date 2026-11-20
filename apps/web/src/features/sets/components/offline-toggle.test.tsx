import 'fake-indexeddb/auto';
import type { SetDetail } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearOfflineData, getOfflineSet } from '@/lib/offline-store';
import { OfflineToggle } from './offline-toggle';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const set = (updatedAt: string) =>
  ({
    id: 's1',
    title: 'Trái cây',
    updatedAt,
    termLang: 'en',
    defLang: 'vi',
    cards: [{ id: 'c1', term: 'apple', definition: 'quả táo' }],
  }) as unknown as SetDetail;

describe('OfflineToggle', () => {
  afterEach(() => clearOfflineData());

  it('tải về máy, xoá bản offline, báo cập nhật khi bộ đã đổi', async () => {
    const { rerender } = render(<OfflineToggle set={set('2026-11-01T00:00:00.000Z')} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Tải về máy' }));
    expect(await screen.findByRole('button', { name: 'Xoá bản offline' })).toBeInTheDocument();
    expect((await getOfflineSet('s1'))?.set.title).toBe('Trái cây');

    rerender(<OfflineToggle set={set('2026-11-02T00:00:00.000Z')} />);
    expect(await screen.findByRole('button', { name: 'Cập nhật bản offline' })).toBeInTheDocument();
  });
});
