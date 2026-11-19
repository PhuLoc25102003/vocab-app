import {
  importCardsResultSchema,
  importPreviewResponseSchema,
  setResponseSchema,
  type CardInput,
  type ImportPreviewInput,
  type ImportPreviewResult,
  type Visibility,
} from '@vocab/shared';
import { http } from '@/lib/http';

export async function previewImport(input: ImportPreviewInput): Promise<ImportPreviewResult> {
  const body = await http('/import/preview', { method: 'POST', body: JSON.stringify(input) });
  return importPreviewResponseSchema.parse(body).data;
}

/** Trả `id` bộ từ đã nhận thẻ. */
export async function importIntoSet(setId: string, cards: CardInput[]): Promise<string> {
  const body = await http(`/sets/${encodeURIComponent(setId)}/import`, {
    method: 'POST',
    body: JSON.stringify({ cards }),
  });
  return importCardsResultSchema.parse(body).data.id;
}

export interface NewSetInput {
  title: string;
  visibility: Visibility;
  cards: CardInput[];
}

/** Tạo bộ mới kèm toàn bộ thẻ, trả `id` bộ từ. */
export async function importAsNewSet(input: NewSetInput): Promise<string> {
  const body = await http('/sets', { method: 'POST', body: JSON.stringify(input) });
  return setResponseSchema.parse(body).data.id;
}
