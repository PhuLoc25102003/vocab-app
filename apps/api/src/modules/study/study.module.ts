import { Module } from '@nestjs/common';
import { ProgressModule } from '../progress/progress.module';
import { ReviewController } from './review.controller';
import { StudyController } from './study.controller';
import { StudyRepository } from './study.repository';
import { StudyService } from './study.service';

@Module({
  imports: [ProgressModule],
  controllers: [StudyController, ReviewController],
  providers: [StudyService, StudyRepository],
})
export class StudyModule {}
