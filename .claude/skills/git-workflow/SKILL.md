---
name: git-workflow
description: Dùng khi tạo issue, tạo nhánh, commit, đẩy code, mở hoặc cập nhật PR, merge, xử lý hotfix hoặc revert trong vocab-app, và khi bắt đầu một việc mới cần đi theo flow phát triển chuẩn.
---

# Flow phát triển

Repo: `https://github.com/PhuLoc25102003/vocab-app`. Nhánh `main` là production, nhánh `develop` là nơi tích hợp việc đang phát triển. Quy ước gốc nằm ở `docs/06-conventions.md`.

```text
Issue → Nhánh từ develop → Code + test → Kiểm tra → Commit → Push → PR vào develop → Review → Squash merge → Dọn nhánh

develop → PR phát hành vào main → Merge commit → Deploy
```

## Quy tắc an toàn

- Không commit hoặc push thẳng lên `main` hay `develop`. Mọi thay đổi đi qua PR.
- Chỉ tạo issue, push, mở PR khi người dùng yêu cầu làm bước đó hoặc yêu cầu chạy cả flow.
- **Chỉ merge khi người dùng xác nhận rõ PR đó.** Ngoại lệ duy nhất: skill `ship-task` được tự squash merge vào `develop` khi đủ điều kiện của skill đó. Merge vào `main` luôn cần xác nhận.
- Không force push lên `main` hay `develop`, không xoá hai nhánh này. Trên nhánh của mình chỉ dùng `--force-with-lease`.
- Không commit `.env`, secret hoặc `apps/api/src/generated`.

## Công cụ

Ưu tiên GitHub CLI. Kiểm tra bằng `gh auth status`. Nếu chưa có `gh`, soạn sẵn nội dung và đưa người dùng link:

- Tạo issue: `https://github.com/PhuLoc25102003/vocab-app/issues/new`
- Tạo PR: `https://github.com/PhuLoc25102003/vocab-app/compare/develop...<tên-nhánh>?expand=1`

## 1. Issue

Chọn việc từ `docs/07-progress.md`, theo mục "Việc tiếp theo". Mỗi việc có một issue, đủ nhỏ để xong trong một PR. Ngoại lệ: sửa tài liệu hoặc cấu hình nhỏ dưới khoảng 20 dòng có thể bỏ qua issue.

Tiêu đề viết tiếng Việt theo dạng `<type>(<scope>): <kết quả mong muốn>`:

```text
feat(study): thêm chế độ nghe viết
fix(auth): không bị đăng xuất khi nhiều request cùng refresh
```

| Type       | Dùng khi                          | Label           |
| ---------- | --------------------------------- | --------------- |
| `feat`     | Thêm khả năng mới cho người dùng  | `type:feat`     |
| `fix`      | Sửa lỗi                           | `type:fix`      |
| `refactor` | Đổi cấu trúc, không đổi hành vi   | `type:refactor` |
| `docs`     | Chỉ đổi tài liệu                  | `type:docs`     |
| `test`     | Chỉ thêm hoặc sửa test            | `type:test`     |
| `chore`    | Công cụ, dependency, CI, cấu hình | `type:chore`    |

Scope: `web`, `api`, `shared`, `db`, `auth`, `users`, `sets`, `cards`, `import`, `study`, `progress`, `stats`, `ui`, `deps`, `ci`, `docs`. Thêm `priority:high` nếu việc đang chặn việc khác hoặc lỗi ảnh hưởng người dùng.

Nội dung cho tính năng hoặc việc thường:

```markdown
## Mục tiêu

Người dùng hoặc hệ thống cần gì, vì sao.

## Phạm vi

- Làm:
- Không làm:

## Tiêu chí hoàn thành

- [ ] Kết quả kiểm tra được
- [ ] Trường hợp lỗi, quyền truy cập, trạng thái UI liên quan

## Ghi chú kỹ thuật

Endpoint, bảng dữ liệu, tài liệu hoặc skill liên quan.
```

Nội dung cho lỗi:

```markdown
## Hiện tượng

## Cách tái hiện

1.

## Kết quả mong muốn

## Môi trường và log

## Tiêu chí hoàn thành

- [ ] Hết lỗi theo các bước tái hiện
- [ ] Có test ngăn lỗi quay lại
```

```bash
gh issue create --title "feat(study): thêm chế độ nghe viết" --label "type:feat" --body-file <file>
```

Label chưa có thì hỏi người dùng rồi tạo một lần bằng `gh label create <tên> --force`.

## 2. Nhánh

Tên nhánh: `<type>/<số-issue>-<mô-tả-ngắn>`, chữ thường, không dấu, nối bằng `-`. Không có issue thì bỏ phần số.

```text
feat/12-dictation-mode
fix/31-refresh-race
docs/fix-api-typo
```

```bash
git switch develop
git pull --ff-only origin develop
git switch -c feat/12-dictation-mode
```

Trước khi tạo nhánh, chạy `git status --short`. Nếu có thay đổi chưa commit không thuộc việc này, dừng lại và hỏi người dùng.

## 3. Phát triển

Dùng đúng skill theo loại việc:

| Việc              | Skill          |
| ----------------- | -------------- |
| Tính năng FE + BE | `new-feature`  |
| Endpoint          | `api-endpoint` |
| Chế độ học        | `study-mode`   |
| Giao diện         | `ui-component` |
| Đổi schema        | `db-migration` |

Chỉ làm trong phạm vi issue. Việc phát sinh thì tạo issue khác.

## 4. Kiểm tra và commit

```bash
npm run format
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` cần Postgres đang chạy (`npm run db:up`). Sau đó chạy skill `code-review`.

Commit theo Conventional Commits, tiêu đề tiếng Anh, thể mệnh lệnh, chữ thường, không dấu chấm cuối, tối đa 72 ký tự:

```text
feat(study): add dictation mode
fix(auth): handle concurrent token refresh
feat(api)!: change set response format
```

Dấu `!` đánh dấu thay đổi phá vỡ tương thích, thân commit phải giải thích cách chuyển đổi. Stage đúng file cần thiết, không dùng `git add -A` khi còn thay đổi không liên quan.

## 5. Đồng bộ và push

```bash
git fetch origin
git rebase origin/develop
git push -u origin HEAD
```

Sau khi rebase một nhánh đã push: `git push --force-with-lease`.

Nếu `develop` có migration mới, rebase rồi kiểm tra thứ tự migration. Migration chưa merge của nhánh có thể cần tạo lại theo skill `db-migration`. Hỏi người dùng trước khi reset database.

## 6. Pull request

- Tiêu đề PR là commit sẽ vào `develop`, nên phải đúng định dạng commit ở trên.
- Một PR giải quyết một việc, khoảng dưới 400 dòng, không tính lockfile và migration sinh tự động.
- Chưa xong thì mở Draft.
- Trong PR, cập nhật `docs/07-progress.md` theo mục "Cách cập nhật" của file đó.
- `Closes #12` chỉ tự đóng issue khi PR vào nhánh mặc định của repo. Nếu nhánh mặc định không phải `develop`, đóng issue thủ công sau khi merge.

```markdown
Closes #12

## Thay đổi

## Lý do

## Cách kiểm tra

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Kiểm tra thủ công:

## Ảnh chụp

Bắt buộc nếu đổi UI: light, dark, 360 px.

## Rủi ro và migration

Ghi "Không có" nếu không có.
```

```bash
gh pr create --base develop --title "feat(study): add dictation mode" --body-file <file>
```

## 7. Review và merge

Điều kiện merge:

- [ ] Đạt Definition of Done trong `docs/06-conventions.md`
- [ ] `code-review` không còn mục "Chưa đạt"
- [ ] CI xanh khi repo đã có CI, nếu chưa có thì đã chạy đủ lệnh ở bước 4
- [ ] Không còn xung đột với `develop`
- [ ] Người dùng xác nhận merge, hoặc đang chạy `ship-task` và PR vào `develop` đủ điều kiện tự merge

PR vào `develop` luôn dùng squash merge:

```bash
gh pr merge 34 --squash --delete-branch
```

Sau đó đồng bộ máy local:

```bash
git switch develop
git pull --ff-only origin develop
git fetch --prune origin
```

Sau squash merge, `git branch -d` có thể báo nhánh chưa merge. Chỉ dùng `git branch -D <nhánh>` sau khi xác nhận PR đã merge.

## 8. Phát hành lên production

Khi `develop` đã ổn định và người dùng yêu cầu phát hành, mở PR từ `develop` vào `main`. Merge vào `main` là phát hành.

```bash
gh pr create --base main --head develop --title "chore(release): release YYYY-MM-DD" --body-file <file>
gh pr merge <số-pr> --merge
```

- Nội dung PR liệt kê các thay đổi, migration và việc cần làm khi deploy.
- Chạy đủ lệnh ở bước 4 trên `develop` trước khi mở PR.
- Dùng merge commit, **không squash**, để `main` và `develop` giữ chung lịch sử.
- Không dùng `--delete-branch` cho PR này.

## Hotfix và revert

- **Hotfix:** chỉ dùng cho lỗi đang ảnh hưởng production. Tạo issue `fix` có `priority:high`, nhánh `fix/<số>-<mô-tả>` từ `main`, giữ thay đổi nhỏ nhất, mở PR vào `main`. Sau khi merge, mở PR từ `main` vào `develop` và dùng merge commit để `develop` nhận bản sửa.
- **Revert:** tạo nhánh từ nhánh đang chứa commit lỗi (`develop`, hoặc `main` nếu lỗi đã lên production), chạy `git revert <sha>`, mở PR vào chính nhánh đó với tiêu đề `revert: <tiêu đề cũ>`. Không viết lại lịch sử `main` hay `develop`.
- Revert có migration phải dùng migration mới để đưa schema về trạng thái an toàn, không sửa migration đã merge.

## Kết thúc mỗi bước, báo cho người dùng

Issue và PR đã tạo kèm link, tên nhánh, lệnh kiểm tra đã chạy và kết quả, việc còn chờ người dùng quyết định.
