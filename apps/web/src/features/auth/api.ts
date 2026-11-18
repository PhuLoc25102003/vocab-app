import type { AuthSession, GoogleLoginInput, LoginInput, RegisterInput } from '@vocab/shared';
import { http } from '@/lib/http';

export async function registerAccount(input: RegisterInput): Promise<void> {
  await http('/auth/register', { method: 'POST', body: JSON.stringify(input), skipAuth: true });
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const { data } = await http<{ data: AuthSession }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
    skipAuth: true,
  });
  return data;
}

export async function loginWithGoogle(input: GoogleLoginInput): Promise<AuthSession> {
  const { data } = await http<{ data: AuthSession }>('/auth/google', {
    method: 'POST',
    body: JSON.stringify(input),
    skipAuth: true,
  });
  return data;
}

export async function refresh(): Promise<AuthSession> {
  const { data } = await http<{ data: AuthSession }>('/auth/refresh', {
    method: 'POST',
    skipAuth: true,
  });
  return data;
}

export function logout(): Promise<void> {
  return http('/auth/logout', { method: 'POST' });
}
