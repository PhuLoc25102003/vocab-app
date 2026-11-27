import { Module } from '@nestjs/common';
import { ProgressModule } from '../progress/progress.module';
import { ReviewController } from './review.controller';
import { StudyController } from './study.controller';
import { StudyRepository } from './study.repository';
import { StudyService } from './study.service';
import { WordRainController } from './word-rain.controller';
import { WordRainRepository } from './word-rain.repository';
import { WordRainService } from './word-rain.service';

@Module({
  imports: [ProgressModule],
  controllers: [StudyController, ReviewController, WordRainController],
  providers: [StudyService, StudyRepository, WordRainService, WordRainRepository],
})
export class StudyModule {}
