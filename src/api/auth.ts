import { apiRequest, markSessionEstablished, clearEstablishedSession } from './client';
import type { UserSummary } from './users';

export type LoginResponse = { user_summary: UserSummary };

export type SessionState = {
  user_summary: UserSummary;
  idle_expires_at: string;
  absolute_expires_at: string;
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });

  markSessionEstablished();
  return response;
}

export async function restoreSession(signal?: AbortSignal): Promise<SessionState> {
  const session = await apiRequest<SessionState>('/auth/session', { signal });
  markSessionEstablished();
  return session;
}

export async function logout(): Promise<void> {
  await apiRequest<void>('/auth/logout', { method: 'POST' });
  clearEstablishedSession();
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
