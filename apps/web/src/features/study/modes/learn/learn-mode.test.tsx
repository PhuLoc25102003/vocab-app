import type { Question } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LearnModeView } from './learn-mode';

const choice: Question = {
  id: 'c1:choice',
  cardId: 'c1',
  mode: 'LEARN',
  prompt: 'apple',
  expected: 'quả táo',
  choices: ['quả lê', 'quả táo'],
};
const write: Question = {
  id: 'c1:write',
  cardId: 'c1',
  mode: 'LEARN',
  prompt: 'quả táo',
  expected: 'apple',
};

function setup(round: Question[] = [choice, write]) {
  const onAnswer = vi.fn();
  render(
    <LearnModeView
      question={round[0]!}
      round={round}
      languages={{ term: 'en', definition: 'vi' }}
      onAnswer={onAnswer}
    />,
  );
  return onAnswer;
}

const next = () => userEvent.click(screen.getByRole('button', { name: 'Câu tiếp theo' }));

async function typeAnswer(value: string) {
  await userEvent.type(screen.getByLabelText('Nhập từ'), value);
  await userEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }));
  await next();
}

describe('LearnModeView', () => {
  it('hỏi lại câu sai ở cuối vòng và gửi đáp án lần đầu khi xong vòng', async () => {
    const onAnswer = setup();
    expect(screen.getByText(/Vòng này đã thuộc/)).toHaveTextContent('Vòng này đã thuộc 0/2 câu');

    await userEvent.click(screen.getByRole('button', { name: /quả lê/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Chưa đúng');
    await next();

    await typeAnswer('apple');
    expect(screen.getByText(/Vòng này đã thuộc/)).toHaveTextContent('1/2');
    expect(onAnswer).not.toHaveBeenCalled();

    expect(screen.getByText('Hỏi lại câu trả lời sai')).toBeInTheDocument();
    await userEvent.keyboard('2');
    expect(screen.getByRole('status')).toHaveTextContent('Chính xác');
    await next();

    expect(onAnswer.mock.calls.map(([answer]) => [answer.questionId, answer.value])).toEqual([
      ['c1:choice', 'quả lê'],
      ['c1:write', 'apple'],
    ]);
  });

  it('không có vòng thì chỉ hỏi câu hiện tại', async () => {
    const onAnswer = setup([write]);

    await typeAnswer('Apple');

    expect(onAnswer).toHaveBeenCalledOnce();
    expect(onAnswer.mock.calls[0]?.[0]).toMatchObject({ questionId: 'c1:write', value: 'Apple' });
  });
});
