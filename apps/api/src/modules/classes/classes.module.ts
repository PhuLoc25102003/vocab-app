import { Module } from '@nestjs/common';
import { AssignmentsRepository } from './assignments.repository';
import { AssignmentsService } from './assignments.service';
import { ClassMembersRepository } from './class-members.repository';
import { ClassMembersService } from './class-members.service';
import { ClassMembershipController } from './class-membership.controller';
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
  ],
})
export class ClassesModule {}
