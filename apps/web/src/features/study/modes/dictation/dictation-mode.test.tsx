import type { Question } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isSpeechSupported, speak } from '@/lib/speech';
import { DictationModeView } from './dictation-mode';

vi.mock('@/lib/speech', () => ({ isSpeechSupported: vi.fn(), speak: vi.fn() }));

const question: Question = {
  id: 'c1',
  cardId: 'c1',
  mode: 'DICTATION',
  prompt: 'apple',
  expected: 'apple',
};

function setup() {
  const onAnswer = vi.fn();
  render(
    <DictationModeView
      question={question}
      languages={{ term: 'en', definition: 'vi' }}
      onAnswer={onAnswer}
    />,
  );
  return onAnswer;
}

describe('DictationModeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isSpeechSupported).mockReturnValue(true);
  });

  it('tự đọc từ và không hiện từ trước khi chấm', () => {
    setup();

    expect(speak).toHaveBeenCalledWith('apple', 'en');
    expect(screen.queryByText('apple')).not.toBeInTheDocument();
  });

  it('cho nghe lại', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Nghe lại' }));

    expect(speak).toHaveBeenCalledTimes(2);
  });

  it('chấm đáp án đã gõ', async () => {
    const onAnswer = setup();

    await userEvent.type(screen.getByLabelText('Nhập từ bạn nghe được'), 'aple{Enter}');
    expect(screen.getByText('Chưa đúng')).toBeInTheDocument();
    expect(screen.getByText('apple')).toBeInTheDocument();

    await userEvent.keyboard('{Enter}');
    expect(onAnswer).toHaveBeenCalledWith(expect.objectContaining({ value: 'aple' }));
  });

  it('không kẹt khi trình duyệt không đọc được', async () => {
    vi.mocked(isSpeechSupported).mockReturnValue(false);
    const onAnswer = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Bỏ qua câu này' }));

    expect(speak).not.toHaveBeenCalled();
    expect(onAnswer).toHaveBeenCalledWith({ questionId: 'c1', value: '', timeMs: 0 });
  });
});
