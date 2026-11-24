'use client';

import {
  AlertCircle,
  CheckCircle2,
  Compass,
  ExternalLink,
  Globe,
  Laptop,
  Smartphone,
} from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

interface UnsupportedSpeechDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnsupportedSpeechDialog({ open, onOpenChange }: UnsupportedSpeechDialogProps) {
  const { t } = useTranslation('study');
  const titleId = useId();
  const descId = useId();

  const browsers = [
    {
      name: 'Google Chrome',
      desc: t('speak.browserChrome'),
      tag: t('speak.tagRecommended'),
      icon: Globe,
    },
    {
      name: 'Microsoft Edge',
      desc: t('speak.browserEdge'),
      tag: t('speak.tagSmooth'),
      icon: Laptop,
    },
    {
      name: 'Samsung Internet',
      desc: t('speak.browserSamsung'),
      tag: 'Galaxy',
      icon: Smartphone,
    },
    {
      name: 'Apple Safari',
      desc: t('speak.browserSafari'),
      tag: 'iOS 14.5+',
      icon: Compass,
    },
  ];

  return (
    <Dialog
      open={open}
      onRequestClose={() => onOpenChange(false)}
      labelledBy={titleId}
      describedBy={descId}
      layout="centered"
      size="md"
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <AlertCircle aria-hidden className="size-6" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h2 id={titleId} className="text-h3 font-bold text-text leading-tight">
              {t('speak.unsupportedDialogTitle')}
            </h2>
            <p id={descId} className="text-small text-text-muted leading-relaxed">
              {t('speak.unsupportedDialogDesc')}
            </p>
          </div>
        </div>

        {/* Danh sách các trình duyệt hỗ trợ tốt nhất */}
        <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-surface-elevated/20 p-2 sm:p-3">
          {browsers.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.name}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-surface px-3 py-2.5 shadow-2xs transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <Icon aria-hidden className="size-4" />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-small font-semibold text-text truncate">{b.name}</span>
                    <span className="text-tiny text-text-muted truncate">{b.desc}</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-sm bg-success-soft px-2 py-0.5 text-tiny font-medium text-success shrink-0">
                  <CheckCircle2 aria-hidden className="size-3" />
                  {b.tag}
                </span>
              </div>
            );
          })}
        </div>

        {/* Gợi ý cho người dùng Zalo / Facebook in-app browser */}
        <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary-soft/50 p-3 text-tiny text-text leading-relaxed">
          <ExternalLink aria-hidden className="size-4 shrink-0 text-primary mt-0.5" />
          <p>{t('speak.inAppTip')}</p>
        </div>

        {/* Nút đóng */}
        <div className="flex justify-end pt-1">
          <Button
            type="button"
            variant="primary"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-6 h-10 font-medium"
          >
            {t('speak.gotIt')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
