import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { StudyController } from './study.controller';
import { StudyRepository } from './study.repository';
import { StudyService } from './study.service';

@Module({
  controllers: [StudyController, ReviewController],
  providers: [StudyService, StudyRepository],
})
export class StudyModule {}
