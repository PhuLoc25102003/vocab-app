'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/use-theme';
import { useTranslation } from 'react-i18next';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t('theme.dark')}
      aria-pressed={isDark}
      className="shrink-0"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <Icon aria-hidden className="size-5" />
    </Button>
  );
}
