import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES, type WordRainScoreInput, type WordRainStyle } from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { WordRainRepository } from './word-rain.repository';

/** Điểm cao nhất của Mưa từ theo bộ và kiểu chơi (gõ, nói). */
@Injectable()
export class WordRainService {
  constructor(private readonly wordRain: WordRainRepository) {}

  async best(userId: string, setId: string, style: WordRainStyle) {
    return ok(await this.wordRain.findBest(userId, setId, style));
  }

  /** Chỉ ghi khi cao hơn điểm cũ; bằng điểm thì giữ đợt cao hơn. */
  async saveScore(sessionId: string, { style, score, wave }: WordRainScoreInput) {
    const session = await this.wordRain.findSession(sessionId);
    if (!session) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy phiên học', HttpStatus.NOT_FOUND);
    }
    if (session.mode !== 'WORD_RAIN') {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Phiên này không phải Mưa từ',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const previous = await this.wordRain.findBest(session.userId, session.setId, style);
    const isRecord =
      !previous || score > previous.score || (score === previous.score && wave > previous.wave);
    const best = isRecord ? { score, wave } : previous;
    if (isRecord) {
      await this.wordRain.saveBest(session.userId, session.setId, style, best);
    }
    return ok({ best, isRecord });
  }
}
