'use client';

import { useState } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      className="min-h-11 rounded-md border border-border-strong bg-surface px-3 py-2 text-small transition-colors duration-fast ease-standard hover:bg-primary-soft"
    >
      Giao diện tối
    </button>
  );
}
