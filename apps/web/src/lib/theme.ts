export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'vocab-theme';

export const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

/** Chạy trước khi trang hiển thị để không nháy sai màu. Nội dung cố định, không có dữ liệu người dùng. */
export const themeInitScript = `(function(){var t=null;try{t=localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}var d=t==='dark'||(t!=='light'&&matchMedia('${DARK_MODE_QUERY}').matches);document.documentElement.classList.toggle('dark',d)})()`;
