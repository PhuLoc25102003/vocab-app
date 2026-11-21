import type { Question } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ClozeModeView } from './cloze-mode';

const question: Question = {
  id: 'c1',
  cardId: 'c1',
  mode: 'CLOZE',
  prompt: 'I eat an _____ every day.',
  expected: 'apple',
  hint: 'quả táo',
};

function setup() {
  const onAnswer = vi.fn();
  render(
    <ClozeModeView
      question={question}
      languages={{ term: 'en', definition: 'vi' }}
      onAnswer={onAnswer}
    />,
  );
  return onAnswer;
}

describe('ClozeModeView', () => {
  it('hiện câu có chỗ trống và gợi ý, không lộ đáp án', () => {
    setup();

    expect(screen.getByRole('img', { name: 'chỗ trống' })).toBeInTheDocument();
    expect(screen.getByText('Gợi ý: quả táo')).toBeInTheDocument();
    expect(screen.queryByText(/apple/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Điền từ còn thiếu')).toHaveFocus();
  });

  it('chấm đáp án rồi gửi khi sang câu sau', async () => {
    const onAnswer = setup();

    await userEvent.type(screen.getByLabelText('Điền từ còn thiếu'), 'Apple{enter}');
    expect(screen.getByText(/Chính xác/)).toBeInTheDocument();
    await userEvent.keyboard('{enter}');

    expect(onAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: 'c1', value: 'Apple' }),
    );
  });
});
