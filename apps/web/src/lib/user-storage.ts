const PREFIX = 'vocab-user:';

/** Dữ liệu tạm của người đang đăng nhập trong tab này. Trình duyệt có thể chặn storage. */
export function readUserItem(key: string): string | null {
  try {
    return window.sessionStorage.getItem(`${PREFIX}${key}`);
  } catch {
    return null;
  }
}

export function writeUserItem(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(`${PREFIX}${key}`, value);
  } catch {
    // Hết dung lượng thì chỉ mất khả năng khôi phục, việc học vẫn tiếp tục.
  }
}

export function removeUserItem(key: string): void {
  try {
    window.sessionStorage.removeItem(`${PREFIX}${key}`);
  } catch {
    // Không có storage thì cũng không có gì để xoá.
  }
}

/** Gọi khi đăng xuất để người dùng sau không thấy dữ liệu của người trước. */
export function clearUserItems(): void {
  try {
    const storage = window.sessionStorage;
    for (const key of Object.keys(storage)) {
      if (key.startsWith(PREFIX)) {
        storage.removeItem(key);
      }
    }
  } catch {
    // Không có storage thì cũng không có gì để xoá.
  }
}
