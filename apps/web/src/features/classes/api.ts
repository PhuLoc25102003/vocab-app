import {
  classListSchema,
  classMemberListSchema,
  classResponseSchema,
  type Class,
  type ClassList,
  type ClassMemberList,
  type CreateClassInput,
  type UpdateClassInput,
} from '@vocab/shared';
import { http } from '@/lib/http';

export const CLASSES_PAGE_SIZE = 20;
export const MEMBERS_PAGE_SIZE = 50;

export const classKeys = {
  all: ['classes'] as const,
  list: (archived: boolean, page: number) => ['classes', 'list', archived, page] as const,
  detail: (id: string) => ['classes', 'detail', id] as const,
  members: (id: string, page: number) => ['classes', 'members', id, page] as const,
};

const classPath = (id: string) => `/classes/${encodeURIComponent(id)}`;

export async function listClasses(archived: boolean, page: number): Promise<ClassList> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(CLASSES_PAGE_SIZE),
    archived: String(archived),
  });
  return classListSchema.parse(await http(`/classes?${params.toString()}`));
}

export async function createClass(dto: CreateClassInput): Promise<Class> {
  const body = await http('/classes', { method: 'POST', body: JSON.stringify(dto) });
  return classResponseSchema.parse(body).data;
}

export async function getClass(id: string): Promise<Class> {
  return classResponseSchema.parse(await http(classPath(id))).data;
}

export async function updateClass(id: string, dto: UpdateClassInput): Promise<Class> {
  const body = await http(classPath(id), { method: 'PATCH', body: JSON.stringify(dto) });
  return classResponseSchema.parse(body).data;
}

export async function regenerateJoinCode(id: string): Promise<Class> {
  const body = await http(`${classPath(id)}/join-code`, { method: 'POST' });
  return classResponseSchema.parse(body).data;
}

export async function listMembers(id: string, page: number): Promise<ClassMemberList> {
  const params = new URLSearchParams({ page: String(page), limit: String(MEMBERS_PAGE_SIZE) });
  return classMemberListSchema.parse(await http(`${classPath(id)}/members?${params.toString()}`));
}

export async function removeMember(id: string, userId: string): Promise<void> {
  await http(`${classPath(id)}/members/${encodeURIComponent(userId)}`, { method: 'DELETE' });
}
