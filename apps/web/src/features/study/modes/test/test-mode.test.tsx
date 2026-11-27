import type { Question } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TestModeView } from './test-mode';

const round: Question[] = [
  {
    id: 'c1:choice',
    cardId: 'c1',
    mode: 'TEST',
    prompt: 'apple',
    expected: 'quả táo',
    choices: ['quả lê', 'quả táo'],
  },
  { id: 'c2:write', cardId: 'c2', mode: 'TEST', prompt: 'con mèo', expected: 'cat' },
  { id: 'c3:write', cardId: 'c3', mode: 'TEST', prompt: 'con chó', expected: 'dog' },
];

function setup() {
  const onAnswer = vi.fn();
  render(
    <TestModeView
      question={round[0]!}
      round={round}
      languages={{ term: 'en', definition: 'vi' }}
      onAnswer={onAnswer}
    />,
  );
  return onAnswer;
}

describe('TestModeView', () => {
  it('bảng câu nằm ở thanh nộp bài, bấm số câu đã làm để mở và gập', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    setup();
    const toggle = screen.getByRole('button', { name: /Đã trả lời 0\/3 câu/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Câu 2' }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('không chấm trước khi nộp, nộp thì gửi đáp án cả phần theo thứ tự', async () => {
    const onAnswer = setup();

    await userEvent.click(screen.getByRole('radio', { name: 'quả lê' }));
    await userEvent.type(screen.getByLabelText('Nhập từ cho câu 2'), ' cat {enter}');
    expect(screen.getByLabelText('Nhập từ cho câu 3')).toHaveFocus();
    await userEvent.type(screen.getByLabelText('Nhập từ cho câu 3'), 'dogg');
    expect(screen.queryByText(/Chính xác|Chưa đúng/)).not.toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Nộp bài' }));

    expect(onAnswer.mock.calls.map(([answer]) => [answer.questionId, answer.value])).toEqual([
      ['c1:choice', 'quả lê'],
      ['c2:write', 'cat'],
      ['c3:write', 'dogg'],
    ]);
  });

  it('cảnh báo câu bỏ trống, bấm lần nữa mới nộp và tính câu trống là rỗng', async () => {
    const onAnswer = setup();

    await userEvent.type(screen.getByLabelText('Nhập từ cho câu 2'), 'cat');
    await userEvent.click(screen.getByRole('button', { name: 'Nộp bài' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Còn 2 câu chưa trả lời');
    expect(onAnswer).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Vẫn nộp bài' }));
    await userEvent.click(screen.getByRole('button', { name: 'Vẫn nộp bài' }));

    expect(onAnswer).toHaveBeenCalledTimes(3);
    expect(onAnswer.mock.calls.map(([answer]) => answer.value)).toEqual(['', 'cat', '']);
  });
});
