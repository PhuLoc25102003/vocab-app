import type { AuthSession, AuthUser } from '@vocab/shared';
import { create } from 'zustand';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'signed-out' | 'unavailable';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  /** Chỉ nằm trong bộ nhớ, không lưu xuống trình duyệt. */
  accessToken: string | null;
  setSession: (session: AuthSession) => void;
  clearSession: (status?: 'anonymous' | 'signed-out') => void;
  setStatus: (status: AuthStatus) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  setSession: ({ user, accessToken }) => set({ status: 'authenticated', user, accessToken }),
  clearSession: (status = 'anonymous') => set({ status, user: null, accessToken: null }),
  setStatus: (status) => set({ status }),
}));
