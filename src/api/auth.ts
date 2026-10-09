import { apiRequest, clearCsrfToken } from './client';
import type { UserSummary } from './types.ts';

export type LoginResponse = { user_summary: UserSummary };

export type SessionState = {
  user_summary: UserSummary;
  idle_expires_at: string;
  absolute_expires_at: string;
};

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export function restoreSession(): Promise<SessionState> {
  return apiRequest<SessionState>('/auth/session');
}

export async function logout(): Promise<void> {
  await apiRequest<void>('/auth/logout', { method: 'POST' });
  clearCsrfToken();
}

export function setUserPassword(raw_token: string, new_password: string): Promise<void> {
  return apiRequest<void>('/auth/set-password', {
    method: 'POST',
    body: JSON.stringify({ raw_token, new_password }),
  });
}

export function resetPassword(email: string): Promise<void> {
  return apiRequest<void>('/auth/request-password-reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}
