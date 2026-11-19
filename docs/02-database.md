# Database

Nguồn chuẩn là `apps/api/prisma/schema.prisma`. Khối schema dưới đây được chép nguyên từ file đó. Nếu tài liệu và code lệch nhau, code đúng.

8 bảng nghiệp vụ trên PostgreSQL, quản lý bằng Prisma migration. Migration: `20261118030153_init`, `20261118040948_cascade_deletes`.

Prisma 7: URL kết nối đặt trong `apps/api/prisma.config.ts`; generator `prisma-client`, output `../src/generated/prisma`, `moduleFormat = "cjs"`; `PrismaService` kế thừa `PrismaClient` và dùng adapter `PrismaPg`.

## Schema Prisma

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  STUDENT
  TEACHER
  ADMIN
}

enum Visibility {
  PRIVATE
  CLASS
  PUBLIC
}

enum StudyMode {
  FLASHCARD
  LEARN
  WRITE
  DICTATION
  CLOZE
  MCQ
  MATCH
  TEST
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String?
  googleId     String?   @unique
  displayName  String
  role         Role      @default(STUDENT)
  tokenVersion Int       @default(0)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  refreshSessions RefreshSession[]
  folders         Folder[]
  studySets       StudySet[]
  cardProgress    CardProgress[]
  studySessions   StudySession[]
}

model RefreshSession {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique
  familyId  String
  userAgent String?
  ip        String?
  expiresAt DateTime
  revokedAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model Folder {
  id      String @id @default(cuid())
  ownerId String
  name    String

  owner User       @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  sets  StudySet[]

  @@unique([ownerId, name])
  @@index([ownerId])
}

model StudySet {
  id          String     @id @default(cuid())
  ownerId     String
  folderId    String?
  title       String
  description String?
  termLang    String     @default("en")
  defLang     String     @default("vi")
  visibility  Visibility @default(PRIVATE)
  cardCount   Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  deletedAt   DateTime?

  owner         User           @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  folder        Folder?        @relation(fields: [folderId], references: [id])
  cards         Card[]
  studySessions StudySession[]

  @@index([ownerId, updatedAt])
  @@index([visibility])
}

model Card {
  id         String   @id @default(cuid())
  setId      String
  position   Int
  term       String
  definition String
  phonetic   String?
  example    String?
  imageUrl   String?
  audioUrl   String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  set      StudySet       @relation(fields: [setId], references: [id], onDelete: Cascade)
  progress CardProgress[]
  attempts Attempt[]

  @@index([setId, position])
}

model CardProgress {
  userId     String
  cardId     String
  ease       Float    @default(2.5)
  interval   Int      @default(0)
  reps       Int      @default(0)
  lapses     Int      @default(0)
  dueAt      DateTime @default(now())
  lastResult Boolean?
  updatedAt  DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  card Card @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@id([userId, cardId])
  @@index([userId, dueAt])
}

model StudySession {
  id         String    @id @default(cuid())
  userId     String
  setId      String
  mode       StudyMode
  startedAt  DateTime  @default(now())
  finishedAt DateTime?
  correct    Int       @default(0)
  total      Int       @default(0)

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  set      StudySet  @relation(fields: [setId], references: [id], onDelete: Cascade)
  attempts Attempt[]

  @@index([userId, startedAt])
}

model Attempt {
  id        String   @id @default(cuid())
  sessionId String
  cardId    String
  answer    String
  isCorrect Boolean
  timeMs    Int
  createdAt DateTime @default(now())

  session StudySession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  card    Card         @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@index([cardId])
}
```

## Ghi chú thiết kế

- `cardCount` lưu sẵn để trang danh sách không phải đếm; cập nhật trong cùng transaction khi thêm/xoá thẻ.
- Xoá bộ từ là soft delete (`deletedAt`). `SetsPurgeService` xoá hẳn bộ có `deletedAt` quá 30 ngày, kèm thẻ, phiên học, câu trả lời và tiến độ theo cascade. Job chạy khoảng 1 phút sau khi API khởi động và mỗi 24 giờ (Render gói Free ngủ khi rảnh nên không dùng giờ cố định), xoá theo lô 200 bộ, giữ `pg_try_advisory_xact_lock` để nhiều instance không chạy trùng, ghi log số bộ đã xoá. MVP không có thùng rác, bộ đã xoá không khôi phục được.
- Import lớn dùng `createMany` trong một transaction, tối đa 2.000 thẻ một lần.
- `Class`, `ClassMember`, `Assignment` thêm ở giai đoạn 3, không ảnh hưởng bảng cũ.

## Ý nghĩa một số trường

| Trường                                  | Ý nghĩa                               |
| --------------------------------------- | ------------------------------------- |
| `User.passwordHash`                     | `null` nếu chỉ đăng nhập Google       |
| `User.tokenVersion`                     | Tăng để thu hồi mọi token             |
| `RefreshSession.tokenHash`              | Lưu hash, không lưu token gốc         |
| `RefreshSession.familyId`               | Phát hiện dùng lại token              |
| `StudySet.termLang`, `StudySet.defLang` | Mã BCP-47, dùng cho phát âm           |
| `CardProgress`                          | Dữ liệu SRS theo từng người, từng thẻ |
| `CardProgress.interval`                 | Đơn vị ngày                           |
| `CardProgress.lapses`                   | Số lần quên thẻ đã từng nhớ           |
| `CardProgress.dueAt`                    | Tính bằng `applyReview` trong shared  |

## Lệch giữa spec gốc và code

Theo quy ước, code là chuẩn. Các điểm lệch:

| Quan hệ hoặc trường                     | Spec gốc                       | Code hiện tại                                                        |
| --------------------------------------- | ------------------------------ | -------------------------------------------------------------------- |
| `StudySession.user`, `StudySession.set` | Không khai báo quan hệ         | Có quan hệ, `onDelete: Cascade`                                      |
| `Attempt.card`                          | Không khai báo quan hệ         | Có quan hệ, `onDelete: Cascade`                                      |
| `StudySet.folder`                       | `onDelete: SetNull`            | Không ghi rõ, mặc định của quan hệ tuỳ chọn cũng là `SetNull`        |
| Tên quan hệ trên `User`                 | `sets`, `progress`, `sessions` | `studySets`, `cardProgress`, `refreshSessions`, thêm `studySessions` |

## Hành vi khi xoá hẳn

Các quy tắc dưới đây áp dụng cho lệnh `DELETE` thật. Xoá mềm bằng `deletedAt` không kích hoạt chúng.

| Khi xoá hẳn | Dữ liệu bị xoá theo                                                                   | Dữ liệu giữ lại                                |
| ----------- | ------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `Card`      | `CardProgress`, `Attempt` của thẻ                                                     | `StudySession`, gồm cả số `correct` và `total` |
| `StudySet`  | `Card`, `StudySession` của bộ, cùng `CardProgress` và `Attempt` liên quan             | `Folder`                                       |
| `Folder`    | Không có                                                                              | `StudySet`, với `folderId` thành `null`        |
| `User`      | `RefreshSession`, `Folder`, `StudySet`, `CardProgress`, `StudySession` và dữ liệu con | Không có                                       |

- `PUT /sets/:id/cards` phải giữ nguyên `id` của thẻ không bị xoá. Nếu xoá hết rồi tạo lại, tiến độ học và lịch sử trả lời sẽ mất.
- Thống kê tính từ `Attempt` hoặc `StudySession` sẽ giảm sau khi dữ liệu nguồn bị xoá hẳn. Nếu cần giữ số liệu lâu dài, phải lưu bảng tổng hợp riêng trước khi xoá.

## Đã điều chỉnh so với spec gốc

- Thay khối schema bằng schema thật, chuyển chú thích trường sang bảng riêng.
- Thêm bảng điểm lệch và bảng hành vi khi xoá hẳn.
- Áp dụng `onDelete: Cascade` đã được chốt cho các quan hệ mà spec gốc khai báo Cascade hoặc chưa khai báo.
