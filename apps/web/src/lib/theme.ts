export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'vocab-theme';

export const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

/** Chạy trước khi trang hiển thị để không nháy sai màu và đồng bộ lang từ cookie. Nội dung cố định, không có dữ liệu người dùng. */
export const themeInitScript = `(function(){var t=null;try{t=localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}var d=t!=='light';document.documentElement.classList.toggle('dark',d);try{var m=document.cookie.match(/(?:^|; )vocab\\.locale=([^;]+)/);if(m&&m[1]){document.documentElement.lang=m[1]}}catch(e){}})()`;
