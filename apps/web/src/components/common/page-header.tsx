'use client';

import { MoreVertical } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, MenuContent, MenuTrigger } from '@/components/ui/menu';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Nút hành động của trang, tối đa một nút primary. */
  actions?: ReactNode;
  className?: string;
  headingTag?: 'h1' | 'h2';
  headingId?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  headingTag = 'h1',
  headingId,
}: PageHeaderProps) {
  const { t } = useTranslation('common');
  const [menuOpen, setMenuOpen] = useState(false);
  const HeadingTag = headingTag;

  return (
    <header
      className={cn(
        'flex min-h-[60px] sm:min-h-[64px] items-center justify-between gap-3 rounded-lg border border-border-strong/70 bg-surface/80 px-4 py-2.5 sm:px-5 sm:py-3 shadow-sm shadow-primary/5 backdrop-blur-md transition-all',
        className,
      )}
    >
      <div className="flex max-w-[65ch] min-w-0 flex-col gap-0.5">
        <HeadingTag
          id={headingId}
          className="text-[1.65rem] font-bold text-text wrap-anywhere tracking-tight leading-tight sm:text-[1.85rem]"
        >
          {title}
        </HeadingTag>
        {description ? (
          <p className="wrap-anywhere text-small text-text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop inline actions */}
          <div className="hidden sm:flex sm:items-center sm:gap-2">{actions}</div>

          {/* Mobile 3-dots button & dropdown menu */}
          <div className="sm:hidden">
            <Menu open={menuOpen} onOpenChange={setMenuOpen}>
              <MenuTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="size-11 rounded-md border-border-strong/70 bg-surface/90 text-text hover:bg-primary-soft hover:text-primary"
                  aria-label={t('actions.pageActions')}
                >
                  <MoreVertical aria-hidden className="size-4" />
                </Button>
              </MenuTrigger>
              <MenuContent
                align="end"
                className="flex min-w-48 flex-col gap-1.5 p-2 shadow-lg [&_a]:flex [&_a]:w-full [&_a]:items-center [&_a]:justify-start [&_button]:flex [&_button]:w-full [&_button]:items-center [&_button]:justify-start"
              >
                <div onClick={() => setMenuOpen(false)} className="flex flex-col gap-1.5 w-full">
                  {actions}
                </div>
              </MenuContent>
            </Menu>
          </div>
        </div>
      ) : null}
    </header>
  );
}
