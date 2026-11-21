---
name: ship-task
description: Chạy trọn một task của vocab-app từ issue đến merge vào develop. Chỉ dùng khi người dùng ra lệnh làm task, ví dụ "/ship-task", "/ship-task 0.10", "/ship-task #8", "làm task tiếp theo", "làm việc 0.11".
---

# Làm trọn một task bằng một lệnh

Lệnh của người dùng là sự đồng ý cho toàn bộ flow dưới đây: tạo issue, tạo nhánh, code, commit, push, mở PR và squash merge vào `develop`, nếu đủ điều kiện ở bước 8. Không hỏi lại giữa chừng, trừ các trường hợp ở mục "Dừng lại và hỏi".

Mỗi task có issue, nhánh và PR riêng. Trong lúc PR chờ CI thì làm task tiếp theo (bước 7), không ngồi đợi; cứ thế làm tiếp cho tới khi các task còn lại đều rơi vào mục "Dừng lại và hỏi". Chi tiết về đặt tên và mẫu issue, PR nằm trong skill `git-workflow`.

## Không bao giờ làm

- Merge vào `main`, kể cả PR phát hành, nếu người dùng chưa xác nhận rõ PR đó.
- Dùng `gh pr merge --admin`, `--no-verify`, hoặc sửa branch protection để qua được kiểm tra.
- Xoá, bỏ qua hoặc nới lỏng test và lint để CI xanh.
- Force push lên `main`, `develop`. Commit `.env`, secret hoặc `apps/api/src/generated`.
- Tắt tiến trình không do mình khởi động.

## Các bước

Nếu `gh` chưa có trong PATH, dùng `"/c/Program Files/GitHub CLI/gh.exe"`.

### 1. Chọn task

| Lệnh                | Task                                                          |
| ------------------- | ------------------------------------------------------------- |
| Không có tham số    | Mục đầu tiên trong "Việc tiếp theo" của `docs/07-progress.md` |
| Mã việc, như `0.10` | Việc có mã đó                                                 |
| Số issue, như `#8`  | Issue đó                                                      |
| Mô tả tự do         | Việc khớp trong file tiến độ, nếu không có thì làm theo mô tả |

Kiểm tra: `gh auth status`, `git status --short`. Có thay đổi chưa commit không thuộc task thì dừng lại. Task phải chưa được đánh dấu xong và các việc nó phụ thuộc đã xong.

### 2. Issue

Tìm issue đang mở của task bằng `gh issue list --state open`. Có rồi thì dùng lại. Chưa có thì tạo theo mẫu trong `git-workflow`, nội dung ghi rõ `Việc X.Y trong docs/07-progress.md`.

Label: dùng `type:*` nếu repo đã có. Nếu chưa, `feat` gắn `enhancement`, `fix` gắn `bug`, `docs` gắn `documentation`, loại khác không gắn.

### 3. Nhánh

```bash
git switch develop
git pull --ff-only origin develop
git switch -c <type>/<số-issue>-<mô-tả-ngắn>
```

### 4. Code

Đọc tài liệu theo bảng "Khi làm việc gì" trong `CLAUDE.md` và dùng đúng skill của loại việc. Chỉ làm trong phạm vi issue. Việc phát sinh thì tạo issue mới, không gộp vào.

### 5. Kiểm tra

```bash
npm run format
npm run lint
npm run typecheck
npm test
npm run build
```

- Viết test cho logic mới. `npm test` cần Postgres đang chạy (`npm run db:up`).
- Chạy thử thật: API thì gọi endpoint, web thì mở trình duyệt ở light, dark và 360 px.
- Web có thể chạy ở `:3001` nếu `:3000` đang bận. Tắt server của mình khi xong.
- Lỗi thì đọc và sửa. Sửa 2 lần không được thì dừng lại và báo.

Sau đó chạy skill `code-review` và sửa hết mục "Chưa đạt".

### 6. Commit, push, PR

Mỗi task một commit. Không đoán trước số PR.

1. Commit đúng file của task (chưa sửa `docs/07-progress.md`), rebase lên `origin/develop`, rồi `git push -u origin HEAD`.
2. Mở PR vào `develop` theo mẫu trong `git-workflow`, có `Closes #<số>`.
3. Trong `docs/07-progress.md` **chỉ sửa dòng của task**: `[x]` và `(#<số-PR>)`. Không sửa bảng tổng quan, "Đang ở", "Việc tiếp theo".
4. `git commit --amend --no-edit` rồi `git push --force-with-lease` (chỉ nhánh của task).

#### Tránh xung đột docs

- Dòng của từng task không bao giờ trùng nhau nên các PR song song không xung đột ở `docs/07-progress.md`. Xung đột chỉ đến từ các dòng chung, nên PR của task không chạm vào chúng.
- Bảng tổng quan đồng bộ bằng `npm run progress`. Khi không còn PR nào khác đang mở, mở PR `docs(progress): sync` gồm `npm run progress`, "Đang ở" và "Việc tiếp theo", merge ngay khi CI xanh.
- Người dùng giao thêm việc giữa chừng: tạo nhánh `docs/<số>-them-viec` từ `origin/develop`, chỉ thêm dòng việc và use case, mở PR và merge ngay khi CI xanh. Không gộp vào PR đang code.
- Tránh nhánh xếp chồng. Chỉ tách nhánh từ nhánh của PR khác khi task mới sửa cùng file code. Khi PR gốc đã squash merge: `git rebase --onto origin/develop <commit-cuối-của-PR-gốc>`.
- Nếu vẫn xung đột và chỉ ở file docs: giữ cả hai phía (mỗi dòng task lấy bản `[x]` mới hơn), chạy `npm run progress` nếu bảng bị đụng, `git rebase --continue`, push, rồi merge ngay khi CI xanh, không cần hỏi.

### 7. Chờ CI, không ngồi đợi

CI mất vài phút. Theo dõi ở nền và làm task tiếp theo trong lúc đó:

```bash
gh pr checks <số-pr> --watch --interval 30   # chạy nền, có thông báo khi xong
```

1. Chọn task tiếp theo như bước 1 và tạo issue như bước 2.
2. Task mới không sửa cùng file code với PR đang chờ: tạo nhánh từ `origin/develop` (kể cả khi cả hai cùng đánh dấu `docs/07-progress.md`, vì mỗi PR chỉ sửa dòng của mình). Có sửa cùng file code: tạo nhánh từ nhánh của PR, sau khi PR được squash merge thì `git rebase --onto origin/develop <commit-cuối-của-PR>`.
3. Code task mới như bước 4 và 5.
4. Khi CI của PR cũ xong:
   - Cất phần đang làm: `git stash push -u -m <task-mới>` (hoặc commit tạm trên nhánh mới).
   - Xanh: merge theo bước 8.
   - Đỏ: `git switch <nhánh-PR>`, đọc log bằng `gh run view <id> --log-failed`, sửa, push, rồi quay lại task mới trong lúc chờ lần CI tiếp theo. Đỏ sau 2 lần sửa vì cùng một nguyên nhân thì dừng lại và báo.
   - Quay về nhánh task mới, `git rebase origin/develop`, `git stash pop`, làm tiếp.
5. Không để quá hai PR cùng chờ CI. Không dùng `git worktree` cho repo này: mỗi worktree phải cài lại `node_modules` và `.env`.

Nếu báo chưa có check, chạy lại sau khi GitHub nhận commit.

### 8. Tự merge

Chỉ merge khi **tất cả** điều kiện đều đúng:

- [ ] PR nhắm vào `develop`
- [ ] `Verify` và `E2E` xanh trên commit mới nhất
- [ ] `mergeStateStatus` là `CLEAN`, hoặc `UNSTABLE` chỉ vì check `Vercel` báo hết lượt deploy hoặc bị bỏ qua bởi `vercel-ignore-build.sh` (nhánh PR không build Preview) trong khi `Verify` và `E2E` xanh; ghi rõ điều này trong báo cáo
- [ ] Lệnh ở bước 5 đều qua và `code-review` không còn "Chưa đạt"
- [ ] Không rơi vào mục "Dừng lại và hỏi"

```bash
gh pr merge <số-pr> --squash --delete-branch --match-head-commit "$(git rev-parse HEAD)"
git switch develop
git pull --ff-only origin develop
git fetch --prune origin
git branch -D <nhánh>
```

Chỉ xoá nhánh local sau khi `gh pr view <số-pr> --json state` trả `MERGED`.

### 9. Báo cáo

Nói ngắn gọn: đã làm gì, link issue và PR, đã kiểm tra gì, điều gì chưa kiểm tra được, tiến độ mới và việc tiếp theo.

## Dừng lại và hỏi

Giữ nguyên nhánh và PR nếu đã có, nêu rõ cần người dùng quyết định gì, khi:

- Task cần quyết định trong mục "Quyết định cần chốt" của `docs/07-progress.md` mà chưa chốt.
- Cần tài khoản, secret hoặc thao tác ngoài repo: Neon, Render, Vercel, Google OAuth, Sentry, tên miền, cài đặt GitHub.
- Migration xoá hoặc đổi tên cột, bảng, đổi `onDelete`, hoặc có thể mất dữ liệu.
- Cần `migrate reset` hoặc xoá dữ liệu trong database local.
- Thay đổi quá khoảng 400 dòng, không tính lockfile và migration sinh tự động. Hãy đề xuất cách tách.
- Yêu cầu trong tài liệu mâu thuẫn nhau, hoặc task cần đổi phạm vi đáng kể.
- Lỗi vẫn còn sau 2 lần sửa.
