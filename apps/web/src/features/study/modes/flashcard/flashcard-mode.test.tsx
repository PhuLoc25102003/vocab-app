import type { Question } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FlashcardMode } from './flashcard-mode';

const question: Question = {
  id: 'c1',
  cardId: 'c1',
  mode: 'FLASHCARD',
  prompt: 'apple',
  expected: 'quả táo',
};

function setup() {
  const onAnswer = vi.fn();
  render(<FlashcardMode question={question} onAnswer={onAnswer} />);
  return onAnswer;
}

describe('FlashcardMode', () => {
  it('chỉ cho đánh giá sau khi lật thẻ', async () => {
    const onAnswer = setup();

    expect(screen.queryByRole('button', { name: /Đã nhớ/ })).not.toBeInTheDocument();
    await userEvent.keyboard('2');
    expect(onAnswer).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Lật thẻ' }));
    await userEvent.click(screen.getByRole('button', { name: /Đã nhớ/ }));

    expect(onAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: 'c1', value: 'known' }),
    );
  });

  it('dùng được bằng phím tắt', async () => {
    const onAnswer = setup();

    await userEvent.keyboard(' ');
    expect(screen.getByRole('button', { name: 'Lật về mặt trước' })).toBeInTheDocument();
    await userEvent.keyboard('1');

    expect(onAnswer).toHaveBeenCalledWith(expect.objectContaining({ value: 'unknown' }));
  });

  it('chỉ gửi một đáp án cho mỗi thẻ', async () => {
    const onAnswer = setup();

    await userEvent.keyboard(' 22');
    await userEvent.keyboard('1');

    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it('ẩn mặt đang quay đi với trình đọc màn hình', async () => {
    setup();
    const back = screen.getByText('quả táo').parentElement;

    expect(back).toHaveAttribute('aria-hidden', 'true');
    await userEvent.keyboard(' ');
    expect(back).toHaveAttribute('aria-hidden', 'false');
  });

  it('không lật hai lần khi Space nhấn trên nút đang focus', async () => {
    setup();
    screen.getByRole('button', { name: 'Lật thẻ' }).focus();

    await userEvent.keyboard(' ');

    expect(screen.getByRole('button', { name: 'Lật về mặt trước' })).toBeInTheDocument();
  });
});
