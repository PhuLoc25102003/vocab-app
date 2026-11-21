import { z } from 'zod';
import { studyModeSchema } from '../study/types';
import { paginationMetaSchema } from './pagination';

export const STUDY_ANSWER_BATCH_MAX = 200;
const STUDY_QUESTION_LIMIT_MAX = 2000;
const STUDY_ANSWER_MAX_LENGTH = 500;
const STUDY_ANSWER_TIME_MAX_MS = 3_600_000;
const STUDY_ID_MAX_LENGTH = 64;

const idSchema = z.string().min(1).max(STUDY_ID_MAX_LENGTH);

export const startSessionSchema = z.object({
  setId: idSchema,
  mode: studyModeSchema,
  limit: z.number().int().min(1).max(STUDY_QUESTION_LIMIT_MAX).optional(),
  /** Chỉ học các thẻ đã đến hạn ôn của người gọi. */
  dueOnly: z.boolean().optional(),
  /** Chỉ học các thẻ này, dùng khi học lại thẻ sai. */
  cardIds: z.array(idSchema).min(1).max(STUDY_QUESTION_LIMIT_MAX).optional(),
  /** Phiên học làm cho bài giao này (việc 5.12). */
  assignmentId: idSchema.optional(),
});
export type StartSessionDto = z.infer<typeof startSessionSchema>;

const userAnswerSchema = z.object({
  questionId: idSchema,
  value: z.string().max(STUDY_ANSWER_MAX_LENGTH),
  timeMs: z.number().int().min(0).max(STUDY_ANSWER_TIME_MAX_MS),
});

export const submitAnswersSchema = z.object({
  answers: z.array(userAnswerSchema).min(1).max(STUDY_ANSWER_BATCH_MAX),
});
export type SubmitAnswersDto = z.infer<typeof submitAnswersSchema>;

/** Tiến độ phiên học được giữ ở trình duyệt để khôi phục khi tải lại trang. */
export const studyProgressSchema = z.object({
  position: z.number().int().min(0),
  recorded: z.number().int().min(-1),
  pending: z.array(userAnswerSchema),
});
export type StudyProgress = z.infer<typeof studyProgressSchema>;

export const studySessionSchema = z.object({
  id: z.string(),
  setId: z.string(),
  mode: studyModeSchema,
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  correct: z.number(),
  total: z.number(),
});
export type StudySession = z.infer<typeof studySessionSchema>;

export const questionSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  mode: studyModeSchema,
  prompt: z.string(),
  expected: z.string(),
  choices: z.array(z.string()).optional(),
  hint: z.string().optional(),
  imageUrl: z.string().optional(),
});

/** Mã BCP-47 của từ và nghĩa, dùng để phát âm. */
export const studyLanguagesSchema = z.object({ term: z.string(), definition: z.string() });
export type StudyLanguages = z.infer<typeof studyLanguagesSchema>;

export const startSessionResponseSchema = z.object({
  data: z.object({
    session: studySessionSchema,
    questions: z.array(questionSchema),
    languages: studyLanguagesSchema,
  }),
});

export const submitAnswersResponseSchema = z.object({
  data: z.object({
    results: z.array(
      z.object({ questionId: z.string(), isCorrect: z.boolean(), expected: z.string() }),
    ),
    ignored: z.number(),
  }),
});

export type StartedSession = z.infer<typeof startSessionResponseSchema>['data'];

export const finishSessionResponseSchema = z.object({
  data: z.object({ session: studySessionSchema, wrongCardIds: z.array(z.string()) }),
});
export type SessionResult = z.infer<typeof finishSessionResponseSchema>['data'];

export const dueSetListSchema = z.object({
  data: z.array(z.object({ setId: z.string(), title: z.string(), dueCount: z.number() })),
  meta: paginationMetaSchema,
  summary: z.object({
    dueCards: z.number(),
    /** Thẻ tiếp theo đến hạn lúc nào, `null` khi chưa có thẻ nào đã học. */
    nextDueAt: z.coerce.date().nullable().default(null),
  }),
});
export type DueSetList = z.infer<typeof dueSetListSchema>;
