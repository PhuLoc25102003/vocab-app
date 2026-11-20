import { ERROR_CODES, type AuthSession } from '@vocab/shared';
import { configureHttpAuth, HttpError } from '@/lib/http';
import { getQueryClient } from '@/lib/query-client';
import { clearOfflineData } from '@/lib/offline-store';
import { clearSessionMarker, setSessionMarker } from '@/lib/session-marker';
import * as authApi from './api';
import { useAuthStore } from './store';

/** Khoảng 1,5 giây, đủ để tab khác làm mới xong và trình duyệt nhận cookie mới. */
const MAX_REFRESH_ATTEMPTS = 5;
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
        // Vẫn 409 sau mọi lần thử: refresh trước đó bị huỷ giữa chừng nên trình duyệt giữ token
        // đã thu hồi. Server không cấp lại (docs/04-security.md), nên coi như hết phiên và
        // đưa về trang đăng nhập thay vì báo lỗi mạng.
        const lost = error.status === 401 || error.status === 403;
        if (lost || error.code === ERROR_CODES.REFRESH_IN_PROGRESS) {
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
  // Máy dùng chung không được giữ bộ từ đã tải của người vừa đăng xuất.
  void clearOfflineData();
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
