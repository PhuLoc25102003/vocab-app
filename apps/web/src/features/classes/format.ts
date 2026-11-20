const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const timeFormat = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });

/** Ngày trước giờ sau, ví dụ "01/12/2026 23:59", dễ đọc hơn kiểu mặc định "23:59 01-12". */
export function formatDateTime(value: string): string {
  const date = new Date(value);
  return `${dateFormat.format(date)} ${timeFormat.format(date)}`;
}

export function formatDate(value: string): string {
  return dateFormat.format(new Date(value));
}
