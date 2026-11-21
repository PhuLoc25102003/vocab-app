import type { Question } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { playCorrectSound } from '@/lib/sound';
import { McqModeView } from './mcq-mode';

vi.mock('@/lib/sound', () => ({ playCorrectSound: vi.fn() }));

const question: Question = {
  id: 'c1',
  cardId: 'c1',
  mode: 'MCQ',
  prompt: 'apple',
  expected: 'quả táo',
  choices: ['quả lê', 'quả táo', 'quả nho'],
};

function setup() {
  const onAnswer = vi.fn();
  render(
    <McqModeView
      question={question}
      languages={{ term: 'en', definition: 'vi' }}
      onAnswer={onAnswer}
    />,
  );
  return onAnswer;
}

describe('McqModeView', () => {
  it('chọn đúng rồi sang câu sau', async () => {
    const onAnswer = setup();

    await userEvent.click(screen.getByRole('button', { name: /quả táo/ }));
    expect(screen.getByText('Chính xác')).toBeInTheDocument();
    expect(playCorrectSound).toHaveBeenCalledTimes(1);
    expect(onAnswer).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Câu tiếp theo' }));
    expect(onAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: 'c1', value: 'quả táo' }),
    );
  });

  it('chọn bằng phím số, báo sai và chỉ ra đáp án đúng', async () => {
    const onAnswer = setup();

    await userEvent.keyboard('1');

    expect(screen.getByText('Chưa đúng')).toBeInTheDocument();
    expect(screen.getByLabelText('Đáp án đúng')).toBeInTheDocument();
    expect(screen.getByLabelText('Bạn đã chọn')).toBeInTheDocument();
    await userEvent.keyboard('{Enter}');
    expect(onAnswer).toHaveBeenCalledWith(expect.objectContaining({ value: 'quả lê' }));
  });

  it('không đổi đáp án sau khi đã chọn', async () => {
    const onAnswer = setup();

    await userEvent.keyboard('2');
    await userEvent.keyboard('1');
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{Enter}');

    expect(screen.getByText('Chính xác')).toBeInTheDocument();
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith(expect.objectContaining({ value: 'quả táo' }));
  });

  it('bỏ qua phím số không có đáp án', async () => {
    setup();

    await userEvent.keyboard('4');

    expect(screen.queryByRole('button', { name: 'Câu tiếp theo' })).not.toBeInTheDocument();
  });
});
