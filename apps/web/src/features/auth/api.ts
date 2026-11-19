import {
  accountResponseSchema,
  authSessionSchema,
  updateAccountResponseSchema,
  type Account,
  type AuthSession,
  type AuthUser,
  type ChangePasswordInput,
  type GoogleLoginInput,
  type LoginInput,
  type RegisterInput,
} from '@vocab/shared';
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

export function logoutAll(): Promise<void> {
  return http('/auth/logout-all', { method: 'POST' });
}

export async function getAccount(): Promise<Account> {
  return accountResponseSchema.parse(await http('/users/me')).data.user;
}

async function updateAccount(input: object) {
  const body = await http('/users/me', { method: 'PATCH', body: JSON.stringify(input) });
  return updateAccountResponseSchema.parse(body).data;
}

export async function changeDisplayName(displayName: string): Promise<{ user: AuthUser }> {
  const { user } = await updateAccount({ displayName });
  return { user };
}

export async function changePassword(input: ChangePasswordInput): Promise<AuthSession> {
  return authSessionSchema.parse(await updateAccount(input));
}

export function deleteAccount(password?: string): Promise<void> {
  return http('/users/me', { method: 'DELETE', body: JSON.stringify({ password }) });
}
