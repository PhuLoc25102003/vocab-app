import type { Question } from '@vocab/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MatchModeView } from './match-mode';

const question = (id: string, prompt: string, expected: string): Question => ({
  id,
  cardId: id,
  mode: 'MATCH',
  prompt,
  expected,
});
const round = [
  question('c1', 'apple', 'quả táo'),
  question('c2', 'pear', 'quả lê'),
  question('c3', 'plum', 'quả mận'),
];

function setup() {
  const onAnswer = vi.fn();
  render(
    <MatchModeView
      question={round[0]!}
      round={round}
      languages={{ term: 'en', definition: 'vi' }}
      onAnswer={onAnswer}
    />,
  );
  const terms = within(screen.getByRole('list', { name: 'Từ' }));
  const meanings = within(screen.getByRole('list', { name: 'Nghĩa' }));
  return { onAnswer, terms, meanings };
}

describe('MatchModeView', () => {
  it('ghép đúng cả vòng rồi gửi đáp án theo thứ tự câu, lần ghép đầu quyết định đúng sai', async () => {
    const { onAnswer, terms, meanings } = setup();

    await userEvent.click(terms.getByRole('button', { name: 'pear' }));
    await userEvent.click(meanings.getByRole('button', { name: 'quả táo' }));
    expect(screen.getByRole('status')).toHaveTextContent('Chưa đúng');
    await userEvent.click(meanings.getByRole('button', { name: 'quả lê' }));
    expect(terms.getByRole('button', { name: /pear/ })).toBeDisabled();

    await userEvent.click(terms.getByRole('button', { name: 'apple' }));
    await userEvent.click(meanings.getByRole('button', { name: 'quả táo' }));
    await userEvent.click(terms.getByRole('button', { name: 'plum' }));
    await userEvent.click(meanings.getByRole('button', { name: 'quả mận' }));
    expect(onAnswer).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    expect(onAnswer.mock.calls.map(([answer]) => [answer.questionId, answer.value])).toEqual([
      ['c1', 'quả táo'],
      ['c2', 'quả táo'],
      ['c3', 'quả mận'],
    ]);
  });

  it('dùng được bằng bàn phím và nhắc chọn từ trước', async () => {
    const { terms, meanings } = setup();

    await userEvent.click(meanings.getByRole('button', { name: 'quả lê' }));
    expect(screen.getByRole('status')).toHaveTextContent('Hãy chọn một từ trước.');

    terms.getByRole('button', { name: 'apple' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(terms.getByRole('button', { name: 'apple' })).toHaveAttribute('aria-pressed', 'true');
    meanings.getByRole('button', { name: 'quả táo' }).focus();
    await userEvent.keyboard(' ');

    expect(screen.getByRole('status')).toHaveTextContent('Đúng: apple là quả táo.');
    await vi.waitFor(() => expect(terms.getByRole('button', { name: 'pear' })).toHaveFocus());
  });
});
