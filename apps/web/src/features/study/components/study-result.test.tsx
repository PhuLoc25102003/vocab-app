import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { resources } from '@/lib/i18n/config';
import { encouragement, StudyResult } from './study-result';

vi.mock('./session-xp', () => ({
  SessionXp: ({ xpEarned }: { xpEarned: number }) => <p>+{xpEarned} XP</p>,
}));

describe('StudyResult', () => {
  it('hiện phần trăm, thanh tỉ lệ và lời khích lệ', () => {
    render(
      <StudyResult
        result={{
          session: { correct: 3, total: 4 } as never,
          wrongCardIds: ['c2'],
          xpEarned: 0,
        }}
        questions={[
          { id: 'c1', cardId: 'c1', mode: 'MCQ', prompt: 'apple', expected: 'quả táo' },
          { id: 'c2', cardId: 'c2', mode: 'MCQ', prompt: 'pear', expected: 'quả lê' },
        ]}
        exitHref="/sets/s1"
        onRestart={vi.fn()}
        onRetryWrong={vi.fn()}
      />,
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Tỉ lệ nhớ' })).toHaveAttribute('aria-valuenow', '75');
    expect(screen.getByText('Làm tốt lắm! Ôn thêm vài thẻ là thuộc hết.')).toBeInTheDocument();
    expect(screen.getByText(/^Bạn nhớ/)).toHaveTextContent('Bạn nhớ 3 trên 4 thẻ.');
    expect(screen.getByText('pear')).toBeInTheDocument();
  });

  it.each([
    [100, 'Xuất sắc!'],
    [70, 'Làm tốt lắm!'],
    [40, 'Khá ổn.'],
    [0, 'Khởi đầu nào'],
  ])('lời khích lệ cho %i%%', (percent, start) => {
    const key = encouragement(percent).replace(
      'result.',
      '',
    ) as keyof typeof resources.vi.study.result;
    expect(resources.vi.study.result[key].startsWith(start)).toBe(true);
  });
});
