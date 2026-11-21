import {
  assignmentListSchema,
  assignmentResponseSchema,
  assignmentResultListSchema,
  assignmentSummaryResponseSchema,
  classListSchema,
  classMemberListSchema,
  classMemberResponseSchema,
  memberResultListSchema,
  classResponseSchema,
  joinedClassListSchema,
  joinedClassResponseSchema,
  myAssignmentDetailResponseSchema,
  myAssignmentListSchema,
  submissionResponseSchema,
  setListSchema,
  type Assignment,
  type AssignmentList,
  type AssignmentResultList,
  type AssignmentSummary,
  type Class,
  type ClassList,
  type ClassMember,
  type ClassMemberList,
  type MemberResultList,
  type CreateAssignmentInput,
  type CreateClassInput,
  type JoinClassInput,
  type JoinedClass,
  type JoinedClassList,
  type MyAssignmentDetail,
  type ProgressStatus,
  type MyAssignmentList,
  type Submission,
  type SetSummary,
  type UpdateClassInput,
} from '@vocab/shared';
import { http } from '@/lib/http';

export const CLASSES_PAGE_SIZE = 20;
export const MEMBERS_PAGE_SIZE = 20;

export const classKeys = {
  all: ['classes'] as const,
  list: (archived: boolean, page: number) => ['classes', 'list', archived, page] as const,
  detail: (id: string) => ['classes', 'detail', id] as const,
  members: (id: string, page: number) => ['classes', 'members', id, page] as const,
  membersQuery: (id: string, page: number, q: string, sort: string) =>
    ['classes', 'members', id, page, q, sort] as const,
  assignments: (id: string) => ['classes', 'assignments', id] as const,
  assignmentsPage: (id: string, page: number) => ['classes', 'assignments', id, page] as const,
  mySets: ['classes', 'my-sets'] as const,
  joined: ['classes', 'joined'] as const,
  joinedPage: (page: number) => ['classes', 'joined', page] as const,
  member: (id: string, userId: string) => ['classes', 'member', id, userId] as const,
  memberResults: (id: string, userId: string) => ['classes', 'member-results', id, userId] as const,
  myAssignments: ['classes', 'my-assignments'] as const,
  myAssignmentsPage: (page: number) => ['classes', 'my-assignments', page] as const,
  myAssignment: (assignmentId: string) => ['classes', 'my-assignment', assignmentId] as const,
  summary: (id: string, assignmentId: string) => ['classes', 'summary', id, assignmentId] as const,
  results: (id: string, assignmentId: string, page: number, status?: string) =>
    ['classes', 'results', id, assignmentId, page, status ?? 'all'] as const,
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

export async function listMembers(
  id: string,
  page: number,
  options: { q?: string; sort?: string } = {},
): Promise<ClassMemberList> {
  const params = new URLSearchParams({ page: String(page), limit: String(MEMBERS_PAGE_SIZE) });
  if (options.q) params.set('q', options.q);
  if (options.sort) params.set('sort', options.sort);
  return classMemberListSchema.parse(await http(`${classPath(id)}/members?${params.toString()}`));
}

export async function removeMember(id: string, userId: string): Promise<void> {
  await http(`${classPath(id)}/members/${encodeURIComponent(userId)}`, { method: 'DELETE' });
}

export const ASSIGNMENTS_PAGE_SIZE = 20;

/** Bài đã giao của lớp, hạn gần nhất trước. */
export async function listAssignments(id: string, page = 1): Promise<AssignmentList> {
  const params = new URLSearchParams({ page: String(page), limit: String(ASSIGNMENTS_PAGE_SIZE) });
  return assignmentListSchema.parse(
    await http(`${classPath(id)}/assignments?${params.toString()}`),
  );
}

export async function createAssignment(
  id: string,
  dto: CreateAssignmentInput,
): Promise<Assignment> {
  const body = await http(`${classPath(id)}/assignments`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return assignmentResponseSchema.parse(body).data;
}

export async function removeAssignment(id: string, assignmentId: string): Promise<void> {
  await http(`${classPath(id)}/assignments/${encodeURIComponent(assignmentId)}`, {
    method: 'DELETE',
  });
}

/** Bộ từ của giáo viên để chọn khi giao bài, mới sửa trước. */
export async function listMySetsForAssigning(): Promise<SetSummary[]> {
  const params = new URLSearchParams({ page: '1', limit: '100', sort: '-updatedAt' });
  return setListSchema.parse(await http(`/sets?${params.toString()}`)).data;
}

export const RESULTS_PAGE_SIZE = 50;

const assignmentPath = (id: string, assignmentId: string) =>
  `${classPath(id)}/assignments/${encodeURIComponent(assignmentId)}`;

export async function getAssignmentSummary(
  id: string,
  assignmentId: string,
): Promise<AssignmentSummary> {
  const body = await http(`${assignmentPath(id, assignmentId)}/summary`);
  return assignmentSummaryResponseSchema.parse(body).data;
}

export async function listAssignmentResults(
  id: string,
  assignmentId: string,
  page: number,
  status?: ProgressStatus,
): Promise<AssignmentResultList> {
  const params = new URLSearchParams({ page: String(page), limit: String(RESULTS_PAGE_SIZE) });
  if (status) params.set('status', status);
  return assignmentResultListSchema.parse(
    await http(`${assignmentPath(id, assignmentId)}/results?${params.toString()}`),
  );
}

/**
 * Bài cần làm và kết quả một học sinh lấy một trang 100 mục vì đang sắp xếp và tính tổng ở
 * trình duyệt; phân trang cùng API mới ở việc 5.12 và 5.15.
 */
const ONE_PAGE = new URLSearchParams({ page: '1', limit: '100' }).toString();

export async function joinClass(dto: JoinClassInput): Promise<JoinedClass> {
  const body = await http('/classes/join', { method: 'POST', body: JSON.stringify(dto) });
  return joinedClassResponseSchema.parse(body).data;
}

export const JOINED_PAGE_SIZE = 20;

export async function listJoinedClasses(page = 1): Promise<JoinedClassList> {
  const params = new URLSearchParams({ page: String(page), limit: String(JOINED_PAGE_SIZE) });
  return joinedClassListSchema.parse(await http(`/classes/joined?${params.toString()}`));
}

export const MY_ASSIGNMENTS_PAGE_SIZE = 20;

/** Bài cần làm, máy chủ đã xếp: bỏ lỡ, chưa nộp theo hạn, đã nộp. */
export async function listMyAssignments(page = 1): Promise<MyAssignmentList> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(MY_ASSIGNMENTS_PAGE_SIZE),
  });
  return myAssignmentListSchema.parse(await http(`/classes/assignments?${params.toString()}`));
}

const myAssignmentPath = (assignmentId: string) =>
  `/classes/assignments/${encodeURIComponent(assignmentId)}`;

/** Bài giao của học sinh kèm tiến độ từng chế độ và bài nộp. */
export async function getMyAssignment(assignmentId: string): Promise<MyAssignmentDetail> {
  return myAssignmentDetailResponseSchema.parse(await http(myAssignmentPath(assignmentId))).data;
}

export async function submitMyAssignment(assignmentId: string): Promise<Submission> {
  const body = await http(`${myAssignmentPath(assignmentId)}/submit`, { method: 'POST' });
  return submissionResponseSchema.parse(body).data;
}

export async function leaveClass(id: string): Promise<void> {
  await http(`${classPath(id)}/members/me`, { method: 'DELETE' });
}

export async function getMember(id: string, userId: string): Promise<ClassMember> {
  const body = await http(`${classPath(id)}/members/${encodeURIComponent(userId)}`);
  return classMemberResponseSchema.parse(body).data;
}

/** Kết quả của một học sinh qua các bài giao của lớp, một trang 100 bài. */
export async function listMemberResults(id: string, userId: string): Promise<MemberResultList> {
  return memberResultListSchema.parse(
    await http(`${classPath(id)}/members/${encodeURIComponent(userId)}/results?${ONE_PAGE}`),
  );
}
