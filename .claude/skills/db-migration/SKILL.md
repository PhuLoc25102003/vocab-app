---
name: db-migration
description: Dùng khi thay đổi apps/api/prisma/schema.prisma của vocab-app, gồm thêm bảng, cột, index, enum, đổi quan hệ onDelete, đổi tên hoặc xoá cột.
---

# Đổi schema database an toàn

Đọc trước: `docs/02-database.md`. File `schema.prisma` là nguồn chuẩn.

## Nguyên tắc

API cũ vẫn chạy trong lúc migration áp dụng, nên mỗi lần deploy chỉ được đổi theo kiểu "thêm".

| Thay đổi              | Cách làm                                                                  |
| --------------------- | ------------------------------------------------------------------------- |
| Thêm bảng, thêm index | Một lần deploy                                                            |
| Thêm cột              | Cho phép null hoặc có default                                             |
| Thêm giá trị enum     | Một lần deploy, thêm cả ở schema Zod tương ứng                            |
| Cột mới bắt buộc      | Thêm cột null → code ghi cột → backfill → lần sau đặt `NOT NULL`          |
| Đổi tên cột           | Lần 1: thêm cột mới, ghi cả hai, backfill. Lần 2: đọc cột mới, xoá cột cũ |
| Xoá cột hoặc bảng     | Lần 1: code ngừng dùng. Lần 2: xoá                                        |
| Đổi kiểu cột          | Xử lý như đổi tên                                                         |
| Đổi `onDelete`        | Một lần deploy, nhưng phải nêu rõ dữ liệu nào sẽ bị xoá theo              |

Không sửa migration đã commit. Không chạy `migrate reset` hay xoá dữ liệu nếu người dùng chưa đồng ý.

## Các bước

1. Bảo đảm Postgres đang chạy: `npm run db:up`.
2. Sửa `apps/api/prisma/schema.prisma`. Thêm index cho khoá ngoại và cột hay lọc.
3. Tạo và áp dụng migration:

```bash
npm run prisma:migrate -w @vocab/api -- --name add_card_note
```

4. Sinh lại client:

```bash
npm run prisma:generate -w @vocab/api
```

5. Đọc file `apps/api/prisma/migrations/<thời-gian>_<tên>/migration.sql`. Tìm `DROP`, `ALTER COLUMN`, `NOT NULL` và kiểm tra chúng đúng ý định.
6. Cập nhật repository, schema Zod trong `packages/shared` và test.
7. Cập nhật `docs/02-database.md`: khối schema, ghi chú thiết kế, bảng điểm lệch nếu có.
8. Chạy `npm run typecheck` và `npm run build`.

Production dùng `prisma migrate deploy`, chạy trước khi khởi động API. Không dùng `migrate dev` ở production.

## Checklist cuối

- [ ] Lần deploy này chỉ có thay đổi kiểu "thêm", hoặc có kế hoạch hai bước ghi rõ
- [ ] Đã chạy `migrate dev` và `generate`
- [ ] Đã đọc `migration.sql`, không có thao tác mất dữ liệu ngoài ý muốn
- [ ] Migration đã được commit, client trong `src/generated` không bị commit
- [ ] Schema Zod và enum khớp Prisma
- [ ] `docs/02-database.md` đã cập nhật
