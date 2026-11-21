/** Phần nhỏ của Web Speech API mà app dùng, vì TypeScript chưa có sẵn kiểu này. */
interface RecognitionAlternative {
  transcript: string;
}

interface RecognitionEvent {
  results: ArrayLike<ArrayLike<RecognitionAlternative>>;
}

interface Recognition {
  lang: string;
  maxAlternatives: number;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

type RecognitionConstructor = new () => Recognition;

/** `aborted`: người học bấm Dừng, không phải lỗi cần báo. */
export type ListenFailure = 'unsupported' | 'denied' | 'no-speech' | 'failed' | 'aborted';

export class ListenError extends Error {
  override name = 'ListenError';

  constructor(readonly reason: ListenFailure) {
    super(reason);
  }
}

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const scope = window as unknown as Record<string, RecognitionConstructor | undefined>;
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function isRecognitionSupported(): boolean {
  return recognitionConstructor() !== null;
}

const MAX_ALTERNATIVES = 3;

/**
 * Nghe một lần và trả các câu nhận dạng được, câu chắc chắn nhất đứng đầu.
 * Trình duyệt tự xin quyền micro ở lần đầu. `signal` huỷ lần nghe, promise bị từ chối với `aborted`.
 */
export function listenOnce(lang: string, signal?: AbortSignal): Promise<string[]> {
  const Constructor = recognitionConstructor();
  if (!Constructor) {
    return Promise.reject(new ListenError('unsupported'));
  }
  if (signal?.aborted) {
    return Promise.reject(new ListenError('aborted'));
  }
  return new Promise((resolve, reject) => {
    const recognition = new Constructor();
    let settled = false;
    const finish = (action: () => void) => {
      if (!settled) {
        settled = true;
        action();
      }
    };
    recognition.lang = lang;
    recognition.maxAlternatives = MAX_ALTERNATIVES;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const first = event.results[0];
      const transcripts = first
        ? Array.from(first, ({ transcript }) => transcript.trim()).filter(Boolean)
        : [];
      finish(() =>
        transcripts.length ? resolve(transcripts) : reject(new ListenError('no-speech')),
      );
    };
    recognition.onerror = ({ error }) => {
      const reason: ListenFailure =
        error === 'not-allowed' || error === 'service-not-allowed'
          ? 'denied'
          : error === 'no-speech'
            ? 'no-speech'
            : 'failed';
      finish(() => reject(new ListenError(reason)));
    };
    recognition.onend = () => finish(() => reject(new ListenError('no-speech')));
    signal?.addEventListener(
      'abort',
      () => {
        finish(() => reject(new ListenError('aborted')));
        recognition.abort();
      },
      { once: true },
    );
    try {
      recognition.start();
    } catch {
      finish(() => reject(new ListenError('failed')));
    }
  });
}
