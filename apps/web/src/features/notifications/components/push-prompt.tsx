'use client';

import { useQuery } from '@tanstack/react-query';
import { BellRing, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getXpSummary, XP_KEY } from '../api';
import { usePush } from '../push';

const DISMISS_KEY = 'vocab.pushPromptDismissed';

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Lời mời bật nhắc học trên Tổng quan. Chỉ hiện khi người học đã có XP (đã học ít nhất một phiên),
 * thiết bị hỗ trợ, chưa bật, chưa chặn và chưa bấm "Để sau".
 */
export function PushPrompt() {
  const { t } = useTranslation('common');
  const [dismissed, setDismissed] = useState(wasDismissed);
  const xp = useQuery({
    queryKey: XP_KEY,
    queryFn: getXpSummary,
    select: (summary) => summary.totalXp,
  });
  const { status, enable } = usePush();

  if (dismissed || status !== 'off' || !xp.data) {
    return null;
  }
  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Không lưu được thì chỉ ẩn trong lần mở trang này.
    }
    setDismissed(true);
  };

  return (
    <section
      aria-labelledby="push-prompt-title"
      className="glass-surface flex items-start gap-3 rounded-xl border border-primary/25 p-4 sm:p-5"
    >
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"
      >
        <BellRing className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="push-prompt-title" className="text-h3">
            {t('push.promptTitle')}
          </h2>
          <p className="text-small text-text-muted">{t('push.promptBody')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            loading={enable.isPending}
            onClick={() =>
              enable.mutate(undefined, {
                onSuccess: (result) => {
                  if (result === 'on') toast.success(t('push.enabled'));
                  else if (result === 'denied') toast.error(t('push.deniedToast'));
                },
                onError: () => toast.error(t('push.failed')),
              })
            }
          >
            {t('push.enable')}
          </Button>
          <Button variant="secondary" onClick={dismiss}>
            {t('push.later')}
          </Button>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('push.later')}
        className="-mr-2 -mt-2 shrink-0"
        onClick={dismiss}
      >
        <X aria-hidden className="size-5" />
      </Button>
    </section>
  );
}
