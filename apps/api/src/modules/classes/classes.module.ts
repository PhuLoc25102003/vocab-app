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

@Module({
  controllers: [ClassMembershipController, ClassesController],
  providers: [
    ClassesService,
    ClassesRepository,
    ClassMembersService,
    ClassMembersRepository,
    AssignmentsService,
    AssignmentsRepository,
    ClassResultsService,
    ClassResultsRepository,
  ],
})
export class ClassesModule {}
