import type { Question } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WriteModeView } from '../write/write-mode';
import { diffAnswer } from './answer-diff';

const question: Question = {
  id: 'c1',
  cardId: 'c1',
  mode: 'WRITE',
  prompt: 'quả táo',
  expected: 'Apple',
};

function setup() {
  const onAnswer = vi.fn();
  render(
    <WriteModeView
      question={question}
      languages={{ term: 'en', definition: 'vi' }}
      onAnswer={onAnswer}
    />,
  );
  return { onAnswer, input: screen.getByLabelText('Nhập từ') };
}

describe('WriteModeView', () => {
  it('hiện nghĩa và đặt con trỏ vào ô nhập', () => {
    const { input } = setup();

    expect(screen.getByText('quả táo')).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('chấm đúng rồi sang câu sau bằng Enter', async () => {
    const { onAnswer } = setup();

    await userEvent.keyboard(' apple {Enter}');
    expect(screen.getByText('Chính xác')).toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();

    await userEvent.keyboard('{Enter}');
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: 'c1', value: ' apple ' }),
    );
  });

  it('gạch phần sai và ghi đáp án đúng', async () => {
    setup();

    await userEvent.keyboard('appel{Enter}');

    expect(screen.getByText('Chưa đúng')).toBeInTheDocument();
    expect(screen.getByText('el').tagName).toBe('DEL');
    expect(screen.getByText('Apple')).toBeInTheDocument();
  });

  it('không chấm khi chưa nhập gì', async () => {
    setup();

    await userEvent.keyboard('   {Enter}');

    expect(screen.queryByText('Chưa đúng')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kiểm tra' })).toBeDisabled();
  });
});

describe('diffAnswer', () => {
  it('chỉ đánh dấu đoạn khác', () => {
    expect(diffAnswer('aple', 'apple')).toEqual({ before: 'ap', wrong: '', after: 'le' });
    expect(diffAnswer('Apxle', 'apple')).toEqual({ before: 'Ap', wrong: 'x', after: 'le' });
  });

  it('đánh dấu cả câu khi không có gì trùng', () => {
    expect(diffAnswer('xyz', 'apple')).toEqual({ before: '', wrong: 'xyz', after: '' });
  });

  it('phân biệt dấu tiếng Việt', () => {
    expect(diffAnswer('má', 'mà')).toEqual({ before: 'm', wrong: 'á', after: '' });
  });
});
