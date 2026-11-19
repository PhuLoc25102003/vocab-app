import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STUDY_ENTRIES } from '../labels';
import { StudyModeGrid } from './study-mode-grid';

describe('StudyModeGrid', () => {
  it('có nút chính Flashcard và lưới các chế độ còn lại kèm mô tả', () => {
    render(<StudyModeGrid setId="s1" />);

    expect(screen.getByRole('link', { name: 'Bắt đầu học' })).toHaveAttribute(
      'href',
      '/sets/s1/study/flashcard',
    );
    const items = within(screen.getByRole('list')).getAllByRole('link');
    expect(items).toHaveLength(STUDY_ENTRIES.length - 1);
    expect(screen.getByRole('link', { name: /Luyện nói/ })).toHaveAttribute(
      'href',
      '/sets/s1/study/speak',
    );
    expect(screen.getByText('Ghép từ với nghĩa thật nhanh')).toBeInTheDocument();
  });
});
