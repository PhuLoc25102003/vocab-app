import type { Route } from 'next';

/** Tham số URL của thư mục đang mở trên trang Bộ từ, trùng `FOLDER_FIELD` của danh sách bộ từ. */
export const FOLDER_PARAM = 'folder';

/** Mở thư mục thì về trang đầu và bỏ từ khoá tìm, giữ cách sắp xếp. */
export function folderHref(folder: string, sort: string | null): Route {
  const params = new URLSearchParams();
  if (sort) params.set('sort', sort);
  if (folder) params.set(FOLDER_PARAM, folder);
  const query = params.toString();
  return (query ? `/sets?${query}` : '/sets') as Route;
}
