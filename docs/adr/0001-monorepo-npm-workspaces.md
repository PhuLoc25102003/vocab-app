# ADR 0001: Monorepo với npm workspaces

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-11-18

## Bối cảnh

Web (Next.js) và API (NestJS) cùng viết bằng TypeScript và cần dùng chung Zod schema, type, mã lỗi, thuật toán chấm điểm và SRS. Dự án do nhóm nhỏ phát triển. Bản nháp ban đầu dùng pnpm.

## Quyết định

Dùng một monorepo gồm `apps/*` và `packages/*`, quản lý bằng **npm workspaces**, điều phối task và cache bằng **Turborepo**. Chỉ có một `package-lock.json` ở gốc repo.

## Lý do

- Sửa schema và code dùng nó trong cùng một commit, không phải phát hành package.
- npm có sẵn cùng Node, không cần cài hay cấu hình thêm trên máy lập trình và CI.
- Turborepo bù phần tốc độ build bằng cache và chạy theo phụ thuộc.

## Hệ quả

- Dependency được hoist, nên code có thể vô tình import package chưa khai báo. Mỗi workspace phải tự khai báo dependency của mình.
- Cài thư viện bằng `npm i <pkg> -w <workspace>`, không tạo lockfile con.
- `@vocab/shared` phải build trước khi app dùng. Turbo đảm bảo việc này bằng `dependsOn: ["^build"]`.
- Không dùng pnpm hoặc yarn trong repo.

## Phương án đã cân nhắc

- **pnpm workspaces:** cài nhanh và chặt chẽ hơn, nhưng thêm một công cụ phải cài và quản lý.
- **Hai repo riêng:** tách biệt rõ, nhưng phải phát hành và đồng bộ phiên bản package dùng chung.
