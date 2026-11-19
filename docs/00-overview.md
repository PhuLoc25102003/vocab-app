# Tổng quan dự án

Nguồn: tách từ `spec-source.md` (bản 2026-11-18), đã đối chiếu với code ở commit `10ec222`.

## Tổng quan sản phẩm

Ứng dụng web giúp học sinh ôn từ vựng bằng flashcard và nhiều chế độ luyện tập, lấy cảm hứng từ Quizlet. Người dùng có thể import danh sách từ và nghe phát âm từng từ.

| Vai trò                | Làm được gì                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| Khách (chưa đăng nhập) | Xem và học bộ từ công khai, không lưu tiến độ                         |
| Học sinh (STUDENT)     | Tạo và import bộ từ, học mọi chế độ, lưu tiến độ, xem thống kê        |
| Giáo viên (TEACHER)    | Mọi quyền của học sinh, thêm tạo lớp, giao bộ từ, xem kết quả của lớp |
| Quản trị (ADMIN)       | Quản lý người dùng, ẩn nội dung vi phạm                               |

**Phạm vi MVP:**

- Đăng ký, đăng nhập (email + mật khẩu, Google OAuth).
- Tạo, sửa, xoá bộ từ và thẻ từ; import từ text, CSV, Excel, kèm phiên âm và câu ví dụ nếu có, có file mẫu để tải về.
- Chế độ Flashcard, Viết, Nghe – viết, Trắc nghiệm; nghe phát âm.
- Lưu tiến độ từng thẻ; trang "Ôn hôm nay".

**Để sau MVP:** lớp học, luyện nói, PWA offline. Chế độ Learn (2.7, 2.13), Kiểm tra (2.10), Điền từ (2.8) và Ghép cặp (2.9) đã có.

## Kiến trúc hệ thống

Frontend và backend tách riêng, nói chuyện qua REST; chỉ API được truy cập database.

```text
Trình duyệt (React Query, Zustand, Web Speech: phát âm, access token trong RAM)
   │ tải trang                         │ REST /api/v1, Bearer
   ▼                                   ▼
Vercel: Next.js                  Render: API NestJS (JWT guard + phân quyền,
(SSR, cache trang công khai,      Controller → Service → Repository, Zod, Swagger)
 giao diện, proxy)                     │ Prisma                 │ cấp URL ký sẵn
                                       ▼                        ▼
                                 Neon PostgreSQL          Cloudflare R2 (ảnh, âm thanh)
                                                                ▲
Trình duyệt ── tải ảnh lên bằng URL ký sẵn do API cấp ──────────┘
```

Phát âm chạy ngay trên trình duyệt nên không tốn request. Cả web và API đều gửi lỗi về Sentry.

## Tech stack

Toàn bộ viết bằng TypeScript trong một monorepo, nên kiểu dữ liệu và schema kiểm tra đầu vào dùng chung được cho cả frontend và backend.

| Lớp                | Công nghệ                                                       | Lý do chọn                                                                 |
| ------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Monorepo           | npm workspaces + Turborepo                                      | Dùng chung types, Zod schema, config ESLint/TS; build cache nhanh          |
| Frontend           | Next.js 16 (App Router), React 19, TypeScript 5.9               | SSR cho trang công khai (SEO), deploy Vercel không cần cấu hình            |
| UI                 | Tailwind CSS v4 (token trong `globals.css`) + shadcn/ui (Radix) | Component có sẵn accessibility, sở hữu code nên sửa được theo design token |
| State server       | TanStack Query                                                  | Cache, retry, invalidate sau khi sửa dữ liệu                               |
| State client       | Zustand                                                         | Trạng thái phiên học (thẻ hiện tại, điểm), nhẹ hơn Redux                   |
| Form               | React Hook Form + Zod                                           | Dùng lại đúng schema của backend                                           |
| Backend            | NestJS 11 + Fastify adapter                                     | Có sẵn module, DI, guard, pipe: hợp với SOLID                              |
| ORM                | Prisma 7 (driver adapter `@prisma/adapter-pg`)                  | Schema rõ ràng, migration, type an toàn                                    |
| Database           | PostgreSQL trên Neon (local: Docker postgres:17)                | Gói free lâu dài, scale to zero                                            |
| Cache / rate limit | Upstash Redis (giai đoạn 2)                                     | Rate limit đăng nhập, cache bộ từ công khai                                |
| Lưu file           | Cloudflare R2                                                   | Ảnh thẻ từ, file âm thanh; không tính phí egress                           |
| Phát âm            | Web Speech API; TTS cache lên R2 sau này                        | Miễn phí, chạy trên trình duyệt                                            |
| Test               | Vitest, Testing Library, Supertest, Playwright                  | Unit, integration, e2e                                                     |
| Deploy             | Vercel (FE), Render → Railway (BE), Neon (DB)                   | Miễn phí giai đoạn đầu                                                     |
| Giám sát           | Sentry (FE + BE), log JSON bằng Pino                            | Bắt lỗi production, truy vết request                                       |

## Nguyên tắc thiết kế code

Mỗi tính năng là một module độc lập; thêm chế độ học mới chỉ cần thêm một class, không sửa code cũ.

| Nguyên tắc                | Áp dụng cụ thể trong dự án                                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| S – Single responsibility | Controller chỉ nhận request và trả response; Service chứa nghiệp vụ; Repository chỉ truy vấn DB                                                     |
| O – Open/closed           | Mỗi chế độ học là một `StudyModeStrategy`; mỗi định dạng import là một `ImportParser`; đăng ký vào registry                                         |
| L – Liskov                | Mọi strategy trả về cùng kiểu `Question` và `GradeResult`, UI không cần biết đang dùng strategy nào                                                 |
| I – Interface segregation | Tách `CardReader` / `CardWriter`, `TokenSigner` / `TokenVerifier` thay vì một interface lớn                                                         |
| D – Dependency inversion  | Service phụ thuộc vào interface (`ICardRepository`, `IStorageService`, `ITtsProvider`), inject qua NestJS DI; đổi R2 sang S3 không phải sửa service |
| DRY                       | Zod schema và type nằm ở `packages/shared`, dùng cho cả validate API và form; thuật toán chấm điểm, SRS cũng ở đây                                  |
| KISS / YAGNI              | Chưa tách microservice, chưa dùng message queue cho đến khi có nhu cầu thật                                                                         |

**Strategy cho chế độ học** (dùng chung FE và BE, đặt trong `packages/shared/src/study`):

```ts
export interface StudyModeStrategy {
  readonly mode: StudyMode; // 'FLASHCARD' | 'WRITE' | 'DICTATION' | 'MCQ' | ...
  buildQuestions(cards: StudyCard[], options: StudyOptions): Question[];
  grade(question: Question, answer: UserAnswer): GradeResult;
}

const registry = new Map<StudyMode, StudyModeStrategy>();
export const registerMode = (s: StudyModeStrategy) => registry.set(s.mode, s);
export const getMode = (m: StudyMode) => {
  const s = registry.get(m);
  if (!s) throw new Error(`Unknown study mode: ${m}`);
  return s;
};
```

Thêm chế độ mới = viết một class mới + `registerMode(...)` + một component giao diện trong `apps/web/src/features/study/modes/<mode>/`.

## Trạng thái triển khai

Dự án đang làm MVP, tiến độ từng việc nằm ở `07-progress.md`. Bảng tech stack ở trên là đích đến, trạng thái thực tế như sau.

| Trạng thái | Thành phần                                                                                                                                                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Đã có      | npm workspaces, Turborepo, Next.js 16, React 19, Tailwind v4, TanStack Query, Zustand, React Hook Form, NestJS 11 + Fastify, Prisma 7, PostgreSQL 17 trong Docker, Zod 4, JWT, helmet, Swagger, Vitest, Playwright, Testing Library, Supertest, log JSON bằng Pino, shadcn/ui, Prettier, ESLint 9, CI bằng GitHub Actions |
| Chưa có    | Redis, R2, Sentry, cấu hình deploy                                                                                                                                                                                                                                                                                        |

Runtime: Node 24 LTS (`^24.11.0`, bản dùng khi phát triển ghi trong `.nvmrc`), npm 11. Môi trường deploy cũng phải đặt Node 24.

Phiên bản bị giới hạn có chủ đích: NestJS 11 vì Nest 12 chỉ hỗ trợ ESM, TypeScript 5.9 vì `typescript-eslint` cần dưới 6.1, ESLint 9 vì `eslint-plugin-react`, `jsx-a11y` và `import` chưa hỗ trợ ESLint 10, Prisma 7 theo quyết định dự án. tsup đang ở 8.5 và có thể nâng lên 9 khi cần.

## Đã điều chỉnh so với spec gốc

- Ghi rõ phiên bản thực tế trong bảng tech stack, thêm mục trạng thái triển khai.
- `middleware` đổi thành `proxy`, vì Next.js 16 đã đổi tên quy ước này.
- Giá trị `StudyMode` viết hoa theo enum trong Prisma.
- Đường dẫn study đổi thành `packages/shared/src/study`.
- Runtime nâng từ Node 20 (đã hết hỗ trợ) lên Node 24 LTS.
