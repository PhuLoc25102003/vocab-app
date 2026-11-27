#!/usr/bin/env bash
# Lệnh "Ignored Build Step" của Vercel: exit 0 là bỏ qua build, exit 1 là build.
# Gói Free chỉ cho 100 lần deploy mỗi ngày, nên chỉ build `develop` và `main`,
# và chỉ khi commit đổi phần mà web dùng tới. Nhánh PR đã có CI kiểm tra.
case "$VERCEL_GIT_COMMIT_REF" in
  develop | main) ;;
  *)
    echo "Bỏ qua bản Preview của nhánh $VERCEL_GIT_COMMIT_REF"
    exit 0
    ;;
esac

# Thư mục hiện tại là apps/web. So với bản deploy thành công gần nhất của nhánh
# (`VERCEL_GIT_PREVIOUS_SHA`), không chỉ commit cuối: merge kiểu rebase đẩy nhiều commit một lúc,
# commit cuối có thể chỉ đổi API trong khi các commit trước đổi web.
# Không có hoặc không so được (clone nông thiếu commit đó) thì vẫn build cho chắc.
BASE="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"
if git diff --quiet "$BASE" HEAD -- . ../../packages/shared ../../package.json ../../package-lock.json ../../turbo.json; then
  echo "Commit không đổi web, bỏ qua build"
  exit 0
fi
exit 1
