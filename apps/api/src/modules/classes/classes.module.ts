import { Module } from '@nestjs/common';
import { AssignmentsRepository } from './assignments.repository';
import { AssignmentsService } from './assignments.service';
import { ClassMembersRepository } from './class-members.repository';
import { ClassMembersService } from './class-members.service';
import { ClassMembershipController } from './class-membership.controller';
import { ClassResultsRepository } from './class-results.repository';
import { ClassResultsService } from './class-results.service';
import { ClassesController } from './classes.controller';
import { ClassesRepository } from './classes.repository';
import { ClassesService } from './classes.service';
import { TeacherOverviewController } from './teacher-overview.controller';
import { TeacherOverviewRepository } from './teacher-overview.repository';
import { TeacherOverviewService } from './teacher-overview.service';

@Module({
  controllers: [ClassMembershipController, ClassesController, TeacherOverviewController],
  providers: [
    ClassesService,
    ClassesRepository,
    ClassMembersService,
    ClassMembersRepository,
    AssignmentsService,
    AssignmentsRepository,
    ClassResultsService,
    ClassResultsRepository,
    TeacherOverviewService,
    TeacherOverviewRepository,
  ],
})
export class ClassesModule {}
