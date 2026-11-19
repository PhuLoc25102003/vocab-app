import type { Question } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpeakModeView } from './speak-mode';

const question: Question = {
  id: 'c1',
  cardId: 'c1',
  mode: 'SPEAK',
  prompt: 'apple',
  expected: 'apple',
  hint: 'quả táo',
};

/** Bộ nhận dạng giả: lần lượt trả các kết quả trong hàng đợi. */
function installRecognizer(outcomes: (string[] | string)[]) {
  class FakeRecognition {
    lang = '';
    maxAlternatives = 1;
    interimResults = false;
    onresult: ((event: { results: { transcript: string }[][] }) => void) | null = null;
    onerror: ((event: { error: string }) => void) | null = null;
    onend: (() => void) | null = null;
    start() {
      const outcome = outcomes.shift() ?? 'no-speech';
      queueMicrotask(() => {
        if (typeof outcome === 'string') {
          this.onerror?.({ error: outcome });
        } else {
          this.onresult?.({ results: [outcome.map((transcript) => ({ transcript }))] });
        }
      });
    }
    abort() {}
  }
  vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);
}

function setup() {
  const onAnswer = vi.fn();
  const onChecked = vi.fn();
  render(
    <SpeakModeView
      question={question}
      languages={{ term: 'en', definition: 'vi' }}
      onAnswer={onAnswer}
      onChecked={onChecked}
    />,
  );
  return { onAnswer, onChecked };
}

describe('SpeakModeView', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lần nói đầu sai thì cho thử lại, điểm vẫn tính theo lần đầu', async () => {
    installRecognizer([['apples'], ['an apple', 'apple']]);
    const { onAnswer, onChecked } = setup();
    expect(screen.getByText('quả táo')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Bấm để nói' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Chưa đúng. Bạn nói: apples');
    expect(onChecked).toHaveBeenCalledWith(expect.objectContaining({ value: 'apples' }));

    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText(/Chính xác/)).toHaveTextContent('Bạn nói: apple');
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Câu tiếp theo' }));
    expect(onAnswer).toHaveBeenCalledOnce();
    expect(onAnswer.mock.calls[0]?.[0]).toMatchObject({ questionId: 'c1', value: 'apples' });
  });

  it('báo khi bị từ chối micro và cho bỏ qua với đáp án rỗng', async () => {
    installRecognizer(['not-allowed']);
    const { onAnswer } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Bấm để nói' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('chưa cho phép dùng micro');

    await userEvent.click(screen.getByRole('button', { name: 'Bỏ qua' }));
    expect(onAnswer.mock.calls[0]?.[0]).toMatchObject({ questionId: 'c1', value: '' });
  });

  it('trình duyệt không hỗ trợ thì chỉ còn nút bỏ qua', () => {
    setup();

    expect(screen.getByRole('alert')).toHaveTextContent('chưa nhận được giọng nói');
    expect(screen.queryByRole('button', { name: 'Bấm để nói' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bỏ qua' })).toBeInTheDocument();
  });
});
