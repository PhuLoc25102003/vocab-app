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

const aborted = { count: 0 };

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
      // `hang`: micro mở mãi cho tới khi bị huỷ, để test trạng thái đang nghe.
      if (outcome === 'hang') {
        return;
      }
      queueMicrotask(() => {
        if (typeof outcome === 'string') {
          this.onerror?.({ error: outcome });
        } else {
          this.onresult?.({ results: [outcome.map((transcript) => ({ transcript }))] });
        }
      });
    }
    abort() {
      aborted.count += 1;
    }
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
    expect(await screen.findByText(/Chưa đúng/)).toHaveTextContent('Chưa đúng. Bạn nói: apples');
    expect(onChecked).toHaveBeenCalledWith(expect.objectContaining({ value: 'apples' }));

    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText(/Chính xác/)).toHaveTextContent('Bạn nói: apple');
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Câu tiếp theo' }));
    expect(onAnswer).toHaveBeenCalledOnce();
    expect(onAnswer.mock.calls[0]?.[0]).toMatchObject({ questionId: 'c1', value: 'apples' });
  });

  it('đang nghe thì hiện micro và chữ báo, bấm Dừng quay về chờ nói không báo lỗi', async () => {
    aborted.count = 0;
    installRecognizer(['hang']);
    const { onChecked } = setup();

    const mic = screen.getByRole('button', { name: 'Bấm để nói' });
    await userEvent.click(mic);

    expect(screen.getByText('Đang nghe… hãy đọc to từ')).toBeInTheDocument();
    // Vẫn là nút đó, chỉ đổi tên, nên focus bàn phím không bị mất.
    expect(screen.getByRole('button', { name: 'Dừng nghe' })).toBe(mic);
    expect(mic).toHaveFocus();

    await userEvent.click(mic);

    expect(await screen.findByRole('button', { name: 'Bấm để nói' })).toBe(mic);
    expect(screen.queryByText('Đang nghe… hãy đọc to từ')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(aborted.count).toBe(1);
    expect(onChecked).not.toHaveBeenCalled();
  });

  it('rời câu khi micro đang mở thì tắt micro', async () => {
    aborted.count = 0;
    installRecognizer(['hang']);
    const onAnswer = vi.fn();
    const { unmount } = render(
      <SpeakModeView
        question={question}
        languages={{ term: 'en', definition: 'vi' }}
        onAnswer={onAnswer}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Bấm để nói' }));
    unmount();

    expect(aborted.count).toBe(1);
  });

  it('báo khi bị từ chối micro và cho bỏ qua với đáp án rỗng', async () => {
    installRecognizer(['not-allowed']);
    const { onAnswer } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Bấm để nói' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('chưa cho phép dùng micro');

    await userEvent.click(screen.getByRole('button', { name: 'Bỏ qua' }));
    expect(onAnswer.mock.calls[0]?.[0]).toMatchObject({ questionId: 'c1', value: '' });
  });

  it('trình duyệt không hỗ trợ vẫn hiện nút micro cảnh báo, bấm vào mở modal thông báo trình duyệt', async () => {
    // Mock HTMLDialogElement methods in jsdom
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();

    setup();

    // Nút micro vẫn hiện diện cho người dùng thấy có tính năng luyện nói
    const unsupportedBtn = screen.getByRole('button', { name: /Trình duyệt chưa hỗ trợ/i });
    expect(unsupportedBtn).toBeInTheDocument();
    expect(
      screen.getByText(/Trình duyệt chưa hỗ trợ nói - Bấm xem hướng dẫn/i),
    ).toBeInTheDocument();

    await userEvent.click(unsupportedBtn);
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it('nhận diện chính xác khi có dấu chấm câu tự động hoặc mạo từ', async () => {
    installRecognizer([['Apple.']]);
    const { onChecked } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Bấm để nói' }));
    expect(await screen.findByText(/Chính xác/)).toHaveTextContent('Bạn nói: Apple.');
    expect(onChecked).toHaveBeenCalledWith(expect.objectContaining({ value: 'Apple.' }));
  });
});
