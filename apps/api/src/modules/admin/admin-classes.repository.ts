import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../common/base/base.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class AdminClassesRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getClassesOverview() {
    const [teachers, classes, unassignedStudents] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          deletedAt: null,
          OR: [{ role: 'TEACHER' }, { teachingClasses: { some: {} } }],
        },
        select: {
          id: true,
          displayName: true,
          email: true,
          createdAt: true,
          teachingClasses: {
            include: {
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
          },
        },
        orderBy: { displayName: 'asc' },
      }),
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
          lockedAt: true,
          lockReason: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const formattedTeachers = teachers.map((t) => {
      const teacherStudentIds = new Set<string>();
      for (const cls of t.teachingClasses) {
        for (const m of cls.members) {
          teacherStudentIds.add(m.userId);
        }
      }
      return {
        id: t.id,
        displayName: t.displayName,
        email: t.email,
        createdAt: t.createdAt,
        classCount: t.teachingClasses.length,
        totalStudents: teacherStudentIds.size,
        classes: t.teachingClasses.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          joinCode: c.joinCode,
          archivedAt: c.archivedAt,
          createdAt: c.createdAt,
          memberCount: c._count.members,
          assignmentCount: c._count.assignments,
          members: c.members.map((m) => ({
            id: m.user.id,
            displayName: m.user.displayName,
            email: m.user.email,
            joinedAt: m.joinedAt,
          })),
        })),
      };
    });

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
      teachers: formattedTeachers,
      classes: formattedClasses,
      unassignedStudents,
      totalTeachers: formattedTeachers.length,
      totalClasses: formattedClasses.length,
      totalStudentsInClasses: studentIdsInClasses.size,
      totalUnassignedStudents: unassignedStudents.length,
    };
  }
}
