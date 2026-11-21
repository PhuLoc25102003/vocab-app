'use client';

import { ArrowRight, Check, PartyPopper } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { accountStudyBackend } from '../api';
import { PATH_STEPS } from '../path-steps';
import { StudyShell } from './study-shell';
import { useTranslation } from 'react-i18next';

const stepHref = (setId: string, index: number) =>
  `/sets/${setId}/study/path?step=${index + 1}` as Route;

function PathSteps({ current }: { current: number }) {
  const { t } = useTranslation('study');
  return (
    <ol aria-label={t('path.steps')} className="flex flex-wrap items-center gap-x-2 gap-y-1 pb-1">
      {PATH_STEPS.map(({ mode }, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={mode}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-small',
              done && 'border-primary bg-primary-soft text-primary',
              active && 'border-primary bg-primary font-semibold text-primary-fg',
              !done && !active && 'border-border text-text-muted',
            )}
          >
            {done ? (
              <Check aria-hidden className="size-3.5" />
            ) : (
              <span aria-hidden className="tabular-nums">
                {index + 1}
              </span>
            )}
            {t(`path.${mode}`)}
            {done ? <span className="sr-only">{t('path.done')}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * "Bắt đầu học": chạy lần lượt các chế độ trên cùng bộ từ. Mỗi bước là một phiên học bình
 * thường nên kết quả và lịch ôn được lưu như khi học lẻ. Bước không dùng được thì bỏ qua.
 */
export function StudyPath({ setId, step }: { setId: string; step: number }) {
  const { t } = useTranslation('study');
  const router = useRouter();
  const current = PATH_STEPS[step] ?? PATH_STEPS[0];
  const next = PATH_STEPS[step + 1];
  const setHref = `/sets/${setId}` as Route;

  const skip = useCallback(() => {
    router.replace(next ? stepHref(setId, step + 1) : setHref);
  }, [next, router, setHref, setId, step]);

  const resultNote = next ? (
    <Button asChild>
      <Link href={stepHref(setId, step + 1)}>
        {t('path.next', { step: t(`path.${next.mode}`) })}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </Button>
  ) : (
    <p className="flex items-center gap-2 rounded-md border border-primary bg-primary-soft p-3 font-medium text-primary">
      <PartyPopper aria-hidden className="size-5 shrink-0" />
      {t('path.finished')}
    </p>
  );

  return (
    <StudyShell
      // Mỗi bước là một phiên mới, khoá theo chế độ để shell bắt đầu lại từ đầu.
      key={current?.mode}
      backend={accountStudyBackend}
      setId={setId}
      mode={current?.mode ?? 'FLASHCARD'}
      exitHref={setHref}
      header={<PathSteps current={step} />}
      resultNote={resultNote}
      onUnavailable={skip}
    />
  );
}
