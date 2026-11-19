import { ERROR_CODES, type AuthSession } from '@vocab/shared';
import { configureHttpAuth, HttpError } from '@/lib/http';
import { getQueryClient } from '@/lib/query-client';
import { clearSessionMarker, setSessionMarker } from '@/lib/session-marker';
import * as authApi from './api';
import { useAuthStore } from './store';

const MAX_REFRESH_ATTEMPTS = 3;
const REFRESH_RETRY_DELAY_MS = 300;

let refreshing: Promise<string | null> | null = null;
/** Tăng mỗi lần có phiên mới, để kết quả refresh cũ không ghi đè phiên mới hơn. */
let sessionGeneration = 0;

export function startSession(session: AuthSession): void {
  sessionGeneration += 1;
  useAuthStore.getState().setSession(session);
  setSessionMarker();
}

function endSession(): void {
  useAuthStore.getState().clearSession();
  clearSessionMarker();
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runRefresh(): Promise<string | null> {
  const startedAt = sessionGeneration;
  for (let attempt = 1; ; attempt += 1) {
    try {
      const session = await authApi.refresh();
      startSession(session);
      return session.accessToken;
    } catch (error) {
      if (error instanceof HttpError) {
        // Tab khác vừa làm mới phiên, cookie mới sẽ có sau giây lát.
        if (error.code === ERROR_CODES.REFRESH_IN_PROGRESS && attempt < MAX_REFRESH_ATTEMPTS) {
          await wait(REFRESH_RETRY_DELAY_MS);
          continue;
        }
        if (error.status === 401 || error.status === 403) {
          // Người dùng vừa đăng nhập trong lúc chờ: giữ phiên mới, bỏ kết quả cũ.
          if (sessionGeneration !== startedAt) {
            return useAuthStore.getState().accessToken;
          }
          endSession();
          return null;
        }
      }
      // Lỗi mạng hoặc máy chủ không có nghĩa là phiên đã mất.
      const { user, setStatus } = useAuthStore.getState();
      setStatus(user ? 'authenticated' : 'unavailable');
      return null;
    }
  }
}

/** Các request cùng lúc dùng chung một lần refresh. */
export function refreshSession(): Promise<string | null> {
  refreshing ??= runRefresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** Xoá mọi dữ liệu của phiên trên trình duyệt. */
export function leaveSession(): void {
  clearSessionMarker();
  getQueryClient().clear();
  useAuthStore.getState().clearSession('signed-out');
}

export async function signOut(): Promise<void> {
  try {
    await authApi.logout();
  } catch {
    // Vẫn rời phiên trên thiết bị này dù máy chủ không phản hồi.
  }
  leaveSession();
}

configureHttpAuth({
  getAccessToken: () => useAuthStore.getState().accessToken,
  refreshAccessToken: refreshSession,
});
