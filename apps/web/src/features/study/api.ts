import {
  finishSessionResponseSchema,
  startSessionResponseSchema,
  submitAnswersResponseSchema,
  type SessionResult,
  type StartedSession,
  type StudyMode,
  type UserAnswer,
} from '@vocab/shared';
import { http } from '@/lib/http';

/** Nơi lưu phiên học. Shell chỉ biết interface này, không biết có gọi API hay không. */
export interface StudyBackend {
  start: (setId: string, mode: StudyMode) => Promise<StartedSession>;
  submit: (sessionId: string, answers: UserAnswer[]) => Promise<void>;
  finish: (sessionId: string) => Promise<SessionResult>;
}

const sessionPath = (id: string) => `/study/sessions/${encodeURIComponent(id)}`;

export const accountStudyBackend: StudyBackend = {
  async start(setId, mode) {
    const body = await http('/study/sessions', {
      method: 'POST',
      body: JSON.stringify({ setId, mode }),
    });
    return startSessionResponseSchema.parse(body).data;
  },
  async submit(sessionId, answers) {
    const body = await http(`${sessionPath(sessionId)}/answers`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    submitAnswersResponseSchema.parse(body);
  },
  async finish(sessionId) {
    const body = await http(`${sessionPath(sessionId)}/finish`, { method: 'PATCH' });
    return finishSessionResponseSchema.parse(body).data;
  },
};
