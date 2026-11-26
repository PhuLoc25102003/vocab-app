'use client';

import { useSyncExternalStore } from 'react';
import { DARK_MODE_QUERY, THEME_STORAGE_KEY, type Theme } from './theme';

const listeners = new Set<() => void>();

// Dùng khi trình duyệt chặn localStorage, để nút vẫn hoạt động trong phiên hiện tại.
let sessionTheme: Theme | null = null;

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

function readChosenTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : sessionTheme;
  } catch {
    return sessionTheme;
  }
}

function syncTheme(): void {
  const theme = readChosenTheme() ?? 'dark';
  document.documentElement.classList.toggle('dark', theme === 'dark');
  listeners.forEach((listener) => listener());
}

function handleStorage(event: StorageEvent): void {
  if (event.key === THEME_STORAGE_KEY || event.key === null) {
    syncTheme();
  }
}

function subscribe(listener: () => void): () => void {
  const media = window.matchMedia(DARK_MODE_QUERY);
  if (listeners.size === 0) {
    window.addEventListener('storage', handleStorage);
    media.addEventListener('change', syncTheme);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener('storage', handleStorage);
      media.removeEventListener('change', syncTheme);
    }
  };
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function getServerSnapshot(): Theme {
  return 'dark';
}

function setTheme(theme: Theme): void {
  sessionTheme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Không lưu được thì lựa chọn chỉ có tác dụng trong phiên hiện tại.
  }
  syncTheme();
}

export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { theme, setTheme };
}
