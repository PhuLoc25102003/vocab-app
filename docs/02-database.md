# Database

Nguồn chuẩn là `apps/api/prisma/schema.prisma`. Khối schema dưới đây được chép nguyên từ file đó. Nếu tài liệu và code lệch nhau, code đúng.

8 bảng nghiệp vụ trên PostgreSQL, quản lý bằng Prisma migration. Migration đầu tiên: `20261118030153_init`.

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

  owner User       @relation(fields: [ownerId], references: [id])
  sets  StudySet[]

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

  owner         User           @relation(fields: [ownerId], references: [id])
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

  user User @relation(fields: [userId], references: [id])
  card Card @relation(fields: [cardId], references: [id])

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

  user     User      @relation(fields: [userId], references: [id])
  set      StudySet  @relation(fields: [setId], references: [id])
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
  card    Card         @relation(fields: [cardId], references: [id])

  @@index([cardId])
}
```

## Ghi chú thiết kế

- `cardCount` lưu sẵn để trang danh sách không phải đếm; cập nhật trong cùng transaction khi thêm/xoá thẻ.
- Xoá bộ từ là soft delete (`deletedAt`); một cron xoá hẳn sau 30 ngày.
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

## Lệch giữa spec gốc và code

Theo quy ước, code là chuẩn. Các điểm lệch:

| Quan hệ hoặc trường                      | Spec gốc                       | Code hiện tại                                                        |
| ---------------------------------------- | ------------------------------ | -------------------------------------------------------------------- |
| `Folder.owner`, `StudySet.owner`         | `onDelete: Cascade`            | Mặc định `Restrict`                                                  |
| `CardProgress.user`, `CardProgress.card` | `onDelete: Cascade`            | Mặc định `Restrict`                                                  |
| `StudySession.user`, `StudySession.set`  | Không khai báo quan hệ         | Có quan hệ, mặc định `Restrict`                                      |
| `Attempt.card`                           | Không khai báo quan hệ         | Có quan hệ, mặc định `Restrict`                                      |
| `StudySet.folder`                        | `onDelete: SetNull`            | Không ghi rõ, mặc định của quan hệ tuỳ chọn cũng là `SetNull`        |
| Tên quan hệ trên `User`                  | `sets`, `progress`, `sessions` | `studySets`, `cardProgress`, `refreshSessions`, thêm `studySessions` |

## Việc cần quyết định trước khi làm tính năng xoá

`Restrict` mâu thuẫn với ba yêu cầu nghiệp vụ. Khi có dữ liệu học, database sẽ từ chối các thao tác sau:

- `PUT /sets/:id/cards` xoá một thẻ đã có `CardProgress` hoặc `Attempt`.
- Cron xoá hẳn bộ từ sau 30 ngày, vì `Card` và `StudySession` còn tham chiếu.
- "Xoá tài khoản xoá hẳn dữ liệu" trong checklist bảo mật.

Đề xuất: thêm `onDelete: Cascade` cho `CardProgress.user`, `CardProgress.card`, `Attempt.card`, `StudySession.user`, `StudySession.set`, `Folder.owner`, `StudySet.owner` bằng một migration riêng theo skill `db-migration`. Lịch sử học của một thẻ sẽ mất theo thẻ. Nếu cần giữ thống kê, phải chọn phương án khác trước khi migrate.

## Đã điều chỉnh so với spec gốc

- Thay khối schema bằng schema thật, chuyển chú thích trường sang bảng riêng.
- Thêm bảng điểm lệch và việc cần quyết định.
