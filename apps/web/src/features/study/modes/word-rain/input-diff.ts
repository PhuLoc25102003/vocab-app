import { foldChar } from './engine';

/** Bỏ dấu và hạ chữ thường cả chuỗi, để chữ do bộ gõ tiếng Việt dựng lại vẫn so được. */
export function foldText(text: string): string {
  return [...text].map(foldChar).join('');
}

export type InputChange =
  | { kind: 'type'; chars: string[]; fed: string }
  | { kind: 'delete'; fed: string }
  | { kind: 'rewrite'; fed: string };

/**
 * So giá trị mới của ô gõ với phần đã đưa vào engine (`fed`, đã bỏ dấu).
 * Bộ gõ Telex, VNI hay bàn phím có gợi ý có thể thay cả cụm chữ (`aa` thành `â`, `uw` thành `ư`),
 * nên chỉ lấy phần thêm vào cuối; chuỗi bị dựng lại ở giữa thì không bắn gì, chỉ cập nhật mốc.
 */
export function readInputChange(fed: string, value: string): InputChange {
  const folded = foldText(value);
  if (folded.startsWith(fed)) {
    return { kind: 'type', chars: [...folded.slice(fed.length)], fed: folded };
  }
  if (fed.startsWith(folded)) return { kind: 'delete', fed: folded };
  return { kind: 'rewrite', fed: folded };
}
