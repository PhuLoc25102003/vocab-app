---
name: code-review
description: Dùng để tự review thay đổi của vocab-app trước khi commit hoặc mở PR, theo Definition of Done và checklist bảo mật, rồi báo cáo danh sách đạt và chưa đạt.
---

# Tự review trước khi commit

Skill này chỉ kiểm tra và báo cáo. Không tự sửa code hay commit, trừ khi người dùng yêu cầu.

## Các bước

1. Xem phạm vi: `git status --short`, `git diff`, `git diff --cached`, và đọc cả file mới chưa được track.
2. Đọc toàn bộ file đã đổi khi diff không đủ ngữ cảnh.
3. Đối chiếu `docs/06-conventions.md` (Definition of Done) và `docs/04-security.md` (checklist bảo mật). Mục không liên quan ghi "Không áp dụng".
4. Chạy `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Không có test thì ghi rõ là chưa có, không tính là đạt.
5. Quét nhanh:

```bash
git diff HEAD -- '*.tsx' | grep -nE '^\+.*(#[0-9a-fA-F]{3,8}\b|(bg|text|border)-(white|black|[a-z]+-[0-9]{2,3})\b|text-(xs|sm|base|lg|[2-9]?xl)\b)'
git diff HEAD -- '*.ts' '*.tsx' | grep -nE '^\+.*(: any\b|as any\b|@ts-ignore|dangerouslySetInnerHTML)'
git diff --cached --name-only | grep -E '(^|/)\.env$|src/generated'
```

Kết quả quét chỉ là gợi ý, phải đọc lại ngữ cảnh trước khi kết luận.

## Tiêu chí

**Kiến trúc**

- Controller → Service → Repository. Prisma chỉ xuất hiện trong repository và `infrastructure/prisma`.
- Schema và type dùng chung nằm ở `@vocab/shared`. `packages/*` không import `apps/*`.
- Component không gọi `fetch` trực tiếp, `app/` không chứa logic.

**Bảo mật**

- Route mới cần đăng nhập, trừ chỗ có lý do rõ ràng để dùng `@Public()`.
- Có kiểm tra vai trò và sở hữu bằng guard. Query không tin `id` một mình.
- Input được validate và giới hạn độ dài. Không nhận `role`, `ownerId` từ client.
- Không lộ secret, token, mật khẩu trong code, log hoặc response.

**Giao diện**

- Chỉ dùng token trong `docs/05-ui-tokens.md`.
- Đủ loading, empty, error, success. Đúng ở light, dark và 360 px.
- Dùng được bằng bàn phím, focus rõ, vùng bấm tối thiểu 44 px.

**Chất lượng**

- Không `any`. Có test cho 401, 403, trường hợp thành công và logic chấm điểm.
- Migration an toàn. `docs/` đã cập nhật. Commit theo Conventional Commits.

## Mẫu báo cáo

```markdown
## Kết quả: Chưa đạt (2 việc phải sửa)

### Chưa đạt

- `apps/api/src/modules/sets/sets.controller.ts:42`: `PATCH /sets/:id` thiếu `@CheckOwnership('set')`, người khác có thể sửa bộ từ.
- `apps/web/src/features/sets/components/set-list.tsx`: thiếu trạng thái error.

### Đạt

- Kiến trúc Controller → Service → Repository
- Validate bằng schema từ `@vocab/shared`

### Không áp dụng

- Migration: không đổi schema

### Lệnh đã chạy

- `npm run lint`: qua
- `npm test`: 12 test qua
```

Mỗi mục "Chưa đạt" phải có vị trí, vấn đề và hậu quả. Xếp lỗi nghiêm trọng lên đầu. Không ghi "Đạt" cho thứ chưa kiểm tra.
