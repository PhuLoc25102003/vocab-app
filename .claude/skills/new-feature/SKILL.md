---
name: new-feature
description: Dùng khi thêm một tính năng trọn vẹn cần cả backend và frontend trong vocab-app, ví dụ quản lý bộ từ, import, thống kê. Không dùng khi chỉ sửa một endpoint (api-endpoint) hoặc chỉ sửa giao diện (ui-component).
---

# Thêm tính năng trọn vẹn

Đọc trước: `docs/00-overview.md`, `docs/01-code-structure.md` (mục Hiện trạng), `docs/03-api.md`, `docs/04-security.md`.

Ví dụ dưới dùng tính năng `sets`. Thay bằng tên tính năng thật.

## Điều kiện nền

Route cần đăng nhập chỉ chạy được sau khi module auth xong, vì `AuthGuard` hiện từ chối mọi route không có `@Public()`. Nếu chưa có JWT, `@CurrentUser()`, `RolesGuard`, `OwnershipGuard`, hãy làm module auth trước hoặc báo người dùng. Không nới lỏng guard để đi tiếp.

## Các bước, làm đúng thứ tự

### 1. Schema Zod ở shared

Tạo `packages/shared/src/schemas/<tên>.ts`, export từ `packages/shared/src/index.ts`, rồi chạy `npm run build -w @vocab/shared`.

```ts
import { z } from 'zod';

export const updateSetSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
});
export type UpdateSetDto = z.infer<typeof updateSetSchema>;
```

Thêm mã lỗi mới vào `packages/shared/src/errors.ts`.

### 2. Prisma, nếu đổi dữ liệu

Dùng skill `db-migration`.

### 3. Module NestJS

Tạo trong `apps/api/src/modules/<tên>/`: `<tên>.module.ts`, `<tên>.controller.ts`, `<tên>.service.ts`, `<tên>.repository.ts`. Làm từng endpoint theo skill `api-endpoint`.

- Controller chỉ nhận request và trả response.
- Service chứa nghiệp vụ, không dùng `req` hay `res`.
- Repository kế thừa `BaseRepository` và là nơi duy nhất gọi Prisma.
- `dto/` chỉ dùng khi cần type riêng cho API. Schema vẫn nằm ở shared.

### 4. Test integration

Tạo `apps/api/test/<tên>.integration.test.ts`. Mỗi endpoint có đủ: 401 khi chưa đăng nhập, 403 khi sai vai trò hoặc không sở hữu, trường hợp thành công, và 400 nếu có input. Mẫu test xem skill `api-endpoint`.

### 5. API client và hook

`apps/web/src/features/<tên>/api.ts`:

```ts
import type { CreateSetInput } from '@vocab/shared';
import { http } from '@/lib/http';

interface StudySetView {
  id: string;
  title: string;
  cardCount: number;
}

export const setKeys = {
  all: ['sets'] as const,
  list: () => [...setKeys.all, 'list'] as const,
};

export async function getSets() {
  const body = await http<{ data: StudySetView[] }>('/sets');
  return body.data;
}

export async function createSet(input: CreateSetInput) {
  const body = await http<{ data: StudySetView }>('/sets', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.data;
}
```

`apps/web/src/features/<tên>/hooks/use-sets.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSet, getSets, setKeys } from '../api';

export function useSets() {
  return useQuery({ queryKey: setKeys.list(), queryFn: getSets });
}

export function useCreateSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSet,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: setKeys.all }),
  });
}
```

Form dùng React Hook Form với `zodResolver(<schema từ shared>)`.

### 6. Component đủ 4 trạng thái

Tạo trong `features/<tên>/components/`, theo skill `ui-component`. Page trong `src/app` chỉ gọi component của feature.

```tsx
export function SetList() {
  const sets = useSets();
  if (sets.isPending) return <SetListSkeleton />;
  if (sets.isError) return <ErrorState onRetry={() => sets.refetch()} />;
  if (sets.data.length === 0) return <SetListEmpty />;
  return <SetRows sets={sets.data} />;
}
```

### 7. Cập nhật tài liệu

Cập nhật `docs/03-api.md`. Đổi database thì cập nhật `docs/02-database.md`, thêm token thì cập nhật `docs/05-ui-tokens.md`.

## Checklist cuối

- [ ] Schema ở `@vocab/shared`, dùng cho cả API và form
- [ ] Controller → Service → Repository, không gọi Prisma ngoài repository
- [ ] Có guard đúng quyền, test 401, 403, thành công đều xanh
- [ ] UI có loading, empty, error, success
- [ ] Đạt checklist của `ui-component`
- [ ] `docs/` đã cập nhật
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` đều qua
- [ ] Chạy skill `code-review` trước khi commit
