import { z } from 'zod';
import { studyModeSchema } from '../study/types';

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
});
export type StartSessionDto = z.infer<typeof startSessionSchema>;

export const submitAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: idSchema,
        value: z.string().max(STUDY_ANSWER_MAX_LENGTH),
        timeMs: z.number().int().min(0).max(STUDY_ANSWER_TIME_MAX_MS),
      }),
    )
    .min(1)
    .max(STUDY_ANSWER_BATCH_MAX),
});
export type SubmitAnswersDto = z.infer<typeof submitAnswersSchema>;

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
});

export const startSessionResponseSchema = z.object({
  data: z.object({ session: studySessionSchema, questions: z.array(questionSchema) }),
});

export const submitAnswersResponseSchema = z.object({
  data: z.object({
    results: z.array(
      z.object({ questionId: z.string(), isCorrect: z.boolean(), expected: z.string() }),
    ),
    ignored: z.number(),
  }),
});

export const finishSessionResponseSchema = z.object({
  data: z.object({ session: studySessionSchema, wrongCardIds: z.array(z.string()) }),
});
export type SessionResult = z.infer<typeof finishSessionResponseSchema>['data'];
