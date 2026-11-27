'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPushConfig, removePushSubscription, savePushSubscription } from './api';

/**
 * - `unsupported`: trình duyệt không có Web Push, hoặc bản dev chưa có service worker.
 * - `ios-install`: iPhone, iPad mở bằng Safari; phải thêm vào màn hình chính mới nhận được.
 * - `server-off`: máy chủ chưa có khoá VAPID.
 * - `denied`: người dùng đã chặn thông báo trong trình duyệt.
 * - `off`, `on`: chưa bật hoặc đã bật trên thiết bị này.
 */
export type PushStatus =
  'loading' | 'unsupported' | 'ios-install' | 'server-off' | 'denied' | 'off' | 'on';

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches;

/** Khoá VAPID dạng base64url sang mảng byte cho `pushManager.subscribe`. */
function toUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padded = `${base64Url}${'='.repeat((4 - (base64Url.length % 4)) % 4)}`;
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

async function readStatus(): Promise<{ status: PushStatus; publicKey: string }> {
  const browserReady = 'PushManager' in window && 'Notification' in window;
  if (!browserReady) {
    return { status: isIos() && !isStandalone() ? 'ios-install' : 'unsupported', publicKey: '' };
  }
  const reg = await registration();
  if (!reg) return { status: 'unsupported', publicKey: '' };
  const config = await getPushConfig();
  if (!config.enabled) return { status: 'server-off', publicKey: '' };
  if (Notification.permission === 'denied')
    return { status: 'denied', publicKey: config.publicKey };
  const subscription = await reg.pushManager.getSubscription();
  return { status: subscription ? 'on' : 'off', publicKey: config.publicKey };
}

const PUSH_STATUS_KEY = ['notifications', 'push-status'] as const;

/** Trạng thái Web Push của thiết bị này và hai thao tác bật, tắt. */
export function usePush() {
  const queryClient = useQueryClient();
  const state = useQuery({ queryKey: PUSH_STATUS_KEY, queryFn: readStatus, staleTime: Infinity });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: PUSH_STATUS_KEY });

  const enable = useMutation({
    mutationFn: async () => {
      const publicKey = state.data?.publicKey;
      const reg = await registration();
      if (!publicKey || !reg) return 'unsupported' as const;
      // Hỏi quyền chỉ khi người dùng tự bấm, trình duyệt chặn hỏi tự động.
      if ((await Notification.requestPermission()) !== 'granted') return 'denied' as const;
      const subscription =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: toUint8Array(publicKey),
        }));
      const json = subscription.toJSON();
      await savePushSubscription({
        endpoint: subscription.endpoint,
        keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
      });
      return 'on' as const;
    },
    onSettled: refresh,
  });

  const disable = useMutation({
    mutationFn: async () => {
      const subscription = await (await registration())?.pushManager.getSubscription();
      if (!subscription) return;
      await removePushSubscription(subscription.endpoint);
      await subscription.unsubscribe();
    },
    onSettled: refresh,
  });

  return {
    status: state.isPending ? ('loading' as const) : (state.data?.status ?? 'unsupported'),
    enable,
    disable,
  };
}
