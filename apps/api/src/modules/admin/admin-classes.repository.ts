import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../common/base/base.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class AdminClassesRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getClassesOverview() {
    const [classes, unassignedStudents] = await Promise.all([
      this.prisma.class.findMany({
        include: {
          teacher: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  email: true,
                },
              },
            },
            orderBy: { joinedAt: 'desc' },
          },
          _count: {
            select: {
              members: true,
              assignments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.findMany({
        where: {
          role: 'STUDENT',
          deletedAt: null,
          classMembers: { none: {} },
        },
        select: {
          id: true,
          displayName: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const formattedClasses = classes.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      joinCode: c.joinCode,
      archivedAt: c.archivedAt,
      createdAt: c.createdAt,
      teacher: c.teacher,
      memberCount: c._count.members,
      assignmentCount: c._count.assignments,
      members: c.members.map((m) => ({
        id: m.user.id,
        displayName: m.user.displayName,
        email: m.user.email,
        joinedAt: m.joinedAt,
      })),
    }));

    const studentIdsInClasses = new Set<string>();
    for (const c of classes) {
      for (const m of c.members) {
        studentIdsInClasses.add(m.userId);
      }
    }

    return {
      classes: formattedClasses,
      unassignedStudents,
      totalClasses: formattedClasses.length,
      totalStudentsInClasses: studentIdsInClasses.size,
      totalUnassignedStudents: unassignedStudents.length,
    };
  }
}
