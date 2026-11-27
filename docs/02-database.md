# Database

Nguồn chuẩn là `apps/api/prisma/schema.prisma`. Khối schema dưới đây được chép nguyên từ file đó. Nếu tài liệu và code lệch nhau, code đúng.

11 bảng nghiệp vụ trên PostgreSQL, quản lý bằng Prisma migration. Migration nằm trong `apps/api/prisma/migrations`, mới nhất là `20261120021045_add_classes`.

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
  SPEAK
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
  /// ADMIN khoá tài khoản: không đăng nhập, không gọi API được cho tới khi mở khoá.
  lockedAt     DateTime?
  lockReason   String?
  lockedById   String?
  /// Mục tiêu XP mỗi ngày người học chọn: 10, 20 hoặc 50.
  dailyGoalXp  Int       @default(20)
  /// Thẻ giữ chuỗi còn lại, tối đa 2. Tài khoản mới có sẵn 1 thẻ.
  streakFreezes    Int     @default(1)
  /// Thứ Hai (YYYY-MM-DD, giờ Việt Nam) của lần cấp thẻ gần nhất, null khi chưa tính lần nào.
  streakFreezeWeek String?
  /// Ẩn tên khỏi bảng xếp hạng chung, vẫn hiện trong bảng của lớp.
  hideFromLeaderboard Boolean @default(false)

  refreshSessions RefreshSession[]
  passwordResetTokens PasswordResetToken[]
  folders         Folder[]
  studySets       StudySet[]
  cardProgress    CardProgress[]
  studySessions   StudySession[]
  teachingClasses Class[]
  classMembers    ClassMember[]
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

model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

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
  id           String     @id @default(cuid())
  ownerId      String
  folderId     String?
  title        String
  description  String?
  termLang     String     @default("en")
  defLang      String     @default("vi")
  visibility   Visibility @default(PRIVATE)
  cardCount    Int        @default(0)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  deletedAt    DateTime?
  /// ADMIN ẩn bộ vi phạm: người khác không thấy, chủ bộ và ADMIN vẫn thấy.
  hiddenAt     DateTime?
  hiddenReason String?
  hiddenById   String?

  owner         User           @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  folder        Folder?        @relation(fields: [folderId], references: [id])
  cards         Card[]
  studySessions StudySession[]
  assignments   Assignment[]

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
  /// Phiên học làm cho một bài giao; xoá bài giao thì phiên vẫn còn, chỉ bỏ liên kết.
  assignmentId String?

  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  set        StudySet    @relation(fields: [setId], references: [id], onDelete: Cascade)
  assignment Assignment? @relation(fields: [assignmentId], references: [id], onDelete: SetNull)
  attempts   Attempt[]

  @@index([userId, startedAt])
  @@index([assignmentId, userId])
}

enum XpSource {
  ANSWERS
}

/// Mỗi lần được cộng XP, ví dụ một lô đáp án đã chấm. Tổng, XP ngày và XP tuần đều cộng từ bảng này.
model XpEvent {
  id        String   @id @default(cuid())
  userId    String
  amount    Int
  source    XpSource @default(ANSWERS)
  /// Xoá phiên học thì XP vẫn còn, chỉ bỏ liên kết.
  sessionId String?
  createdAt DateTime @default(now())

  user    User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  session StudySession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
  @@index([createdAt])
  @@index([sessionId])
}

/// Ngày người học bỏ lỡ nhưng đã dùng thẻ giữ chuỗi, nên chuỗi không bị đứt.
model StreakFreezeDay {
  userId    String
  /// Ngày học dạng YYYY-MM-DD theo giờ Việt Nam.
  day       String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, day])
}

/// Huy hiệu đã nhận. `code` là mã trong `BADGES` của `@vocab/shared`, không dùng enum để thêm huy hiệu không cần migration.
model UserBadge {
  userId   String
  code     String
  earnedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, code])
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

/// Lớp do một giáo viên quản lý. Học sinh tham gia bằng `joinCode`, giáo viên đổi được mã.
model Class {
  id          String    @id @default(cuid())
  teacherId   String
  name        String
  description String?
  joinCode    String    @unique
  archivedAt  DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  teacher     User          @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  members     ClassMember[]
  assignments Assignment[]

  @@index([teacherId])
}

model ClassMember {
  classId  String
  userId   String
  joinedAt DateTime @default(now())

  class Class @relation(fields: [classId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([classId, userId])
  @@index([userId])
}

/// Bộ từ giao cho cả lớp với một chế độ học. `dueAt` null là không có hạn nộp.
model Assignment {
  id        String    @id @default(cuid())
  classId   String
  setId     String
  mode      StudyMode
  /// Các chế độ phải làm, theo thứ tự. Thay cho `mode` (giữ lại đến lần deploy sau rồi mới xoá).
  modes     StudyMode[] @default([])
  dueAt     DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  class       Class                  @relation(fields: [classId], references: [id], onDelete: Cascade)
  set         StudySet               @relation(fields: [setId], references: [id], onDelete: Cascade)
  sessions    StudySession[]
  submissions AssignmentSubmission[]

  @@index([classId, dueAt])
  @@index([setId])
}

/// Bài nộp của một học sinh cho một bài giao. Nộp một lần; điểm (phần trăm) chốt lúc nộp, null khi
/// bài chỉ có chế độ không chấm điểm. `late`: nộp sau `dueAt`.
model AssignmentSubmission {
  assignmentId String
  userId       String
  submittedAt  DateTime @default(now())
  score        Int?
  late         Boolean  @default(false)

  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([assignmentId, userId])
  @@index([userId])
}
```

## Ghi chú thiết kế

- `cardCount` lưu sẵn để trang danh sách không phải đếm; cập nhật trong cùng transaction khi thêm/xoá thẻ.
- `User.lockedAt`, `lockReason`, `lockedById` lưu việc ADMIN khoá tài khoản (việc 2.11). `lockedById` là id ADMIN, không đặt khoá ngoại để giữ lịch sử khi tài khoản ADMIN bị xoá. Tài khoản có `lockedAt` không đăng nhập, không refresh được và bị `AuthGuard` từ chối.
- `StudySet.hiddenAt`, `hiddenReason`, `hiddenById` lưu việc ADMIN ẩn bộ vi phạm (việc 2.12). Bộ bị ẩn không còn trong Khám phá và với người khác (`visibleTo()` chỉ cho xem bộ `PUBLIC` có `hiddenAt` null), chủ bộ và ADMIN vẫn thấy.
- Xoá bộ từ là soft delete (`deletedAt`). `SetsPurgeService` xoá hẳn bộ có `deletedAt` quá 30 ngày, kèm thẻ, phiên học, câu trả lời và tiến độ theo cascade. Job chạy khoảng 1 phút sau khi API khởi động và mỗi 24 giờ (Render gói Free ngủ khi rảnh nên không dùng giờ cố định), xoá theo lô 200 bộ, giữ `pg_try_advisory_xact_lock` để nhiều instance không chạy trùng, ghi log số bộ đã xoá. MVP không có thùng rác, bộ đã xoá không khôi phục được.
- Import lớn dùng `createMany` trong một transaction, tối đa 2.000 thẻ một lần.
- `Class`, `ClassMember`, `Assignment` (việc 3.1) là nền cho lớp học, chưa có API. `Class.joinCode` duy nhất toàn hệ thống, giáo viên đổi mã bằng cách ghi mã mới. Lớp lưu trữ có `archivedAt`, không xoá. `ClassMember` có khoá chính `(classId, userId)` nên một học sinh không vào một lớp hai lần. `Assignment.dueAt` lưu UTC, `null` là không có hạn. Xoá giáo viên hoặc lớp thì xoá theo thành viên và bài giao; xoá học sinh chỉ xoá tư cách thành viên; bộ từ bị xoá hẳn (sau 30 ngày soft delete) thì bài giao của bộ đó bị xoá theo.
- Việc 5.10: `Assignment.modes` là danh sách chế độ phải làm theo thứ tự, thay cho `mode` (cột `mode` giữ đến lần deploy sau rồi mới xoá; bài cũ được backfill `[mode]`, bài mới ghi cả hai). `StudySession.assignmentId` (null được) gắn phiên học với bài giao, xoá bài giao thì `SET NULL`. `AssignmentSubmission` khoá chính `(assignmentId, userId)` nên mỗi học sinh nộp một lần; `score` là phần trăm chốt lúc nộp (null khi chỉ có Flashcard), `late` khi nộp sau `dueAt`; xoá bài giao hoặc người dùng thì xoá theo bài nộp. Migration backfill bài nộp từ phiên đã xong cùng bộ, cùng chế độ sau lúc giao của thành viên lớp: thời điểm là lần xong đầu, điểm là phiên tốt nhất.

- `XpEvent` và `User.dailyGoalXp` (việc 7.1): mỗi lô đáp án được cộng XP tạo một dòng trong cùng transaction với `Attempt` và `CardProgress`. Quy tắc tính nằm ở `packages/shared/src/study/xp.ts`. Không lưu tổng XP trên `User`: tổng, XP hôm nay và XP tuần (bảng xếp hạng) đều cộng từ bảng này theo index `userId, createdAt` và `createdAt`. Phiên offline gửi lên muộn được tính vào lúc gửi lên.

- `User.streakFreezes`, `User.streakFreezeWeek` và `StreakFreezeDay` (việc 7.3): không có job hẹn giờ vì Render gói Free ngủ khi rảnh. `StreakService` cấp thẻ và dùng thẻ mỗi khi người học mở Tổng quan hoặc gửi đáp án. Cấp thẻ ghi bằng `updateMany` có điều kiện `streakFreezeWeek` cũ để hai request cùng lúc không cấp hai lần. Dùng thẻ là một transaction tạo `StreakFreezeDay` (khoá chính `userId, day`) rồi trừ `streakFreezes` khi còn lớn hơn 0.

- `UserBadge` (việc 7.4): khoá chính `userId, code` nên trao lại không tạo bản trùng (`createMany` với `skipDuplicates`). Điều kiện huy hiệu tính lại từ dữ liệu sẵn có (`CardProgress`, `StudySession`, `XpEvent`, `Attempt`), không lưu bộ đếm riêng.

- `User.hideFromLeaderboard`, `Class.leaderboardEnabled` (việc 7.5): bảng xếp hạng không có bảng riêng, cộng XP tuần từ `XpEvent` bằng một câu SQL có `row_number()` để vừa lấy top 50 vừa lấy hạng của người gọi.

- `Notification` (việc 7.13): `type` là enum, `data` là JSON nhỏ (tên bộ, tên lớp, hạn, mã huy hiệu) để web dịch câu theo ngôn ngữ. Index `userId, createdAt` cho danh sách và `userId, readAt` cho số chưa đọc. Không có job dọn: thông báo quá 90 ngày bị xoá khi người nhận mở chuông.

- `ReminderLog` (việc 7.7): khoá chính `userId, kind, key` với `key` là ngày (`DAILY`) hoặc id bài giao (`ASSIGNMENT_DUE`), để job nhắc học chạy lại không gửi trùng. Ghi log trước rồi mới tạo thông báo.

- `PushSubscription` (việc 7.8): `endpoint` duy nhất vì dịch vụ đẩy cấp mỗi trình duyệt một endpoint; một người có nhiều dòng (điện thoại, máy tính). Xoá người dùng thì xoá theo.

- `User.locale`, `User.notificationPrefs`, `EmailLog` (việc 7.9): `locale` ghi khi cookie ngôn ngữ khác giá trị đã lưu, `notificationPrefs` là JSON theo `notificationPrefsSchema` (thiếu khoá coi như bật), `EmailLog` đếm mail nhắc học đã gửi để giữ hạn mức Brevo free.

- `StudyMode.WORD_RAIN`, `GameHighScore` (việc 7.11): khoá chính `userId, setId, style`, mỗi người một điểm cao nhất cho mỗi bộ và kiểu chơi (`TYPE`, `SPEAK`). Xoá bộ hoặc người dùng thì xoá theo.

- `PasswordResetToken` (việc 1.49a) lưu liên kết đặt lại mật khẩu. Chỉ lưu SHA-256 của token, token gốc chỉ nằm trong email. Token sống 30 phút, dùng một lần (`usedAt`). Xin liên kết mới thì xoá các token chưa dùng của người đó. Đặt lại mật khẩu thì tăng `tokenVersion` và xoá mọi `RefreshSession` trong cùng transaction. Xoá người dùng thì xoá token theo.

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
