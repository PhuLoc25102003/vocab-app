---
name: study-mode
description: Dùng khi thêm hoặc sửa một chế độ học trong vocab-app như Flashcard, Viết, Nghe viết, Trắc nghiệm, Điền từ, Ghép cặp, theo Strategy pattern dùng chung cho web và API.
---

# Thêm chế độ học

Đọc trước: mục Strategy trong `docs/00-overview.md`, `docs/05-ui-tokens.md`. Thêm chế độ mới không được sửa `StudyShell` theo kiểu thêm nhánh nghiệp vụ, chỉ đăng ký vào registry.

## Điều kiện nền

`packages/shared/src/study` đã có `types.ts`, `registry.ts`, `grading.ts` (`gradeText`) và `srs.ts` (`applyReview`). Package này không được import React hay NestJS.

Test của `packages/shared` đặt cạnh code và chạy bằng Vitest.

## Các bước

1. **Enum.** Kiểm tra `StudyMode` trong `apps/api/prisma/schema.prisma` và `studyModeSchema`. Nếu chưa có, thêm vào cả hai, migration theo skill `db-migration`.
2. **Strategy.** Tạo `packages/shared/src/study/modes/<mode>.ts`. Hàm phải thuần, không gọi mạng và không đọc đồng hồ. Cần ngẫu nhiên thì nhận qua tham số để test được.

```ts
import { gradeText } from '../grading';
import { registerMode } from '../registry';
import type { Question, StudyCard, StudyModeStrategy, StudyOptions, UserAnswer } from '../types';

export class WriteMode implements StudyModeStrategy {
  readonly mode = 'WRITE' as const;

  buildQuestions(cards: StudyCard[], opts: StudyOptions): Question[] {
    return cards.slice(0, opts.limit ?? cards.length).map((card) => ({
      id: card.id,
      cardId: card.id,
      mode: this.mode,
      prompt: card.definition,
      expected: card.term,
    }));
  }

  grade(question: Question, answer: UserAnswer) {
    return gradeText(question.expected, answer.value);
  }
}

registerMode(new WriteMode());
```

3. **Đăng ký.** Thêm `import './modes/<mode>';` vào `packages/shared/src/study/index.ts`, rồi `npm run build -w @vocab/shared`. Kiểm tra bản build vẫn giữ lệnh đăng ký.
4. **Unit test.** Tạo `packages/shared/src/study/modes/<mode>.test.ts`, phủ `buildQuestions` (số câu, giới hạn, danh sách rỗng) và `grade` (đúng, sai, khác hoa thường, khoảng trắng, dấu tiếng Việt).
5. **Component.** Tạo `apps/web/src/features/study/modes/<mode>/<mode>-mode.tsx`, theo skill `ui-component`.

```tsx
import type { Question, UserAnswer } from '@vocab/shared';

interface StudyModeProps {
  question: Question;
  onAnswer: (answer: UserAnswer) => void;
}

export function WriteModeView({ question, onAnswer }: StudyModeProps) {
  // Hiển thị câu hỏi, nhận đáp án, gọi onAnswer đúng một lần cho mỗi câu.
}
```

Component chỉ dựa vào `{ question, onAnswer }`, không đọc store toàn cục. Khai báo nó trong bảng ánh xạ mode của `study-shell.tsx`.

6. **Tài liệu.** Nếu chế độ chuyển từ "để sau MVP" sang đang làm, cập nhật `docs/00-overview.md`.

## Quy tắc giao diện riêng

- Từ và đáp án dùng `font-card`, phiên âm dùng `font-phonetic`.
- Từ dài hơn 24 ký tự dùng `text-card-long`.
- Có thao tác bàn phím: `Space` lật thẻ, `1` đến `4` chọn đáp án, `Enter` gửi.
- Đúng sai có icon và chữ. Chế độ viết gạch đỏ phần sai và ghi đáp án đúng màu xanh.

## Checklist cuối

- [ ] Strategy implements `StudyModeStrategy` và gọi `registerMode`
- [ ] `grade` dùng được ở cả web và API, không phụ thuộc môi trường
- [ ] Unit test `buildQuestions` và `grade` xanh
- [ ] Enum Prisma và `studyModeSchema` khớp nhau
- [ ] Component nhận đúng props `{ question, onAnswer }`
- [ ] Đạt checklist của `ui-component`
