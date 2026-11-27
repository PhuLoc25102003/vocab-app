import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STUDY_ENTRIES } from '../labels';
import { StudyModeGrid } from './study-mode-grid';

describe('StudyModeGrid', () => {
  it('nút "Bắt đầu học" mở lộ trình, lưới có đủ các chế độ kể cả Flashcard', () => {
    render(<StudyModeGrid setId="s1" />);

    const start = screen.getByRole('link', { name: 'Bắt đầu học' });
    expect(start).toHaveAttribute('href', '/sets/s1/study/path');
    expect(start).toHaveAccessibleDescription(/đi lần lượt mọi chế độ/);
    const items = within(screen.getByRole('list')).getAllByRole('link');
    expect(items).toHaveLength(STUDY_ENTRIES.length);
    expect(screen.getByRole('link', { name: /^Flashcard/ })).toHaveAttribute(
      'href',
      '/sets/s1/study/flashcard',
    );
    expect(screen.getByText('Ghép từ với nghĩa thật nhanh')).toBeInTheDocument();
  });

  it('giữ query param ?from=explore khi xem từ Khám phá', () => {
    render(<StudyModeGrid setId="s1" fromExplore />);

    const start = screen.getByRole('link', { name: 'Bắt đầu học' });
    expect(start).toHaveAttribute('href', '/sets/s1/study/path?from=explore');
    expect(screen.getByRole('link', { name: /^Flashcard/ })).toHaveAttribute(
      'href',
      '/sets/s1/study/flashcard?from=explore',
    );
  });
});
