'use client';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { usePush, type PushStatus } from '../push';

const HINTS: Partial<
  Record<PushStatus, 'push.unsupported' | 'push.iosInstall' | 'push.serverOff' | 'push.denied'>
> = {
  unsupported: 'push.unsupported',
  'ios-install': 'push.iosInstall',
  'server-off': 'push.serverOff',
  denied: 'push.denied',
};

/** Nhóm "Thông báo" ở trang Tài khoản: bật tắt thông báo đẩy trên thiết bị này. */
export function NotificationSettings() {
  const { t } = useTranslation('common');
  const { status, enable, disable } = usePush();
  const busy = enable.isPending || disable.isPending;
  const hint = HINTS[status];

  return (
    <section
      aria-labelledby="notification-settings-title"
      className="flex w-full flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-2xs sm:p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="notification-settings-title" className="text-h3">
          {t('push.settingsTitle')}
        </h2>
        <p className="text-small text-text-muted">{t('push.settingsDescription')}</p>
      </div>
      {status === 'loading' ? (
        <Skeleton className="h-11 w-full" />
      ) : hint ? (
        <p role="status" className="rounded-md bg-bg px-3 py-2 text-small text-text-muted">
          {t(hint)}
        </p>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 flex-col">
            <span id="push-device-label" className="font-medium">
              {t('push.deviceLabel')}
            </span>
            <span id="push-device-hint" className="text-small text-text-muted">
              {t('push.deviceHint')}
            </span>
          </span>
          <Switch
            checked={status === 'on'}
            disabled={busy}
            aria-labelledby="push-device-label"
            aria-describedby="push-device-hint"
            onCheckedChange={(next) => {
              if (next) {
                enable.mutate(undefined, {
                  onSuccess: (result) => {
                    if (result === 'on') toast.success(t('push.enabled'));
                    else if (result === 'denied') toast.error(t('push.deniedToast'));
                  },
                  onError: () => toast.error(t('push.failed')),
                });
              } else {
                disable.mutate();
              }
            }}
          />
        </div>
      )}
    </section>
  );
}
