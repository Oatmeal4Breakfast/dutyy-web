import { apiRequest } from './client';
import type { UserSummary, UserSignUpRequest, UserUpdateRequest } from './types';

export function createUser(payload: UserSignUpRequest): Promise<UserSummary> {
  return apiRequest<UserSummary>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUser(payload: UserUpdateRequest): Promise<UserSummary> {
  const hasValue: boolean = [payload.first_name, payload.last_name, payload.email].some(
    (p) => p !== null && p !== undefined && p !== '',
  );

  if (!hasValue) {
    throw new Error('No fields provided to update');
  }

  return apiRequest<UserSummary>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function getUser(): Promise<UserSummary> {
  return apiRequest<UserSummary>('/users/me', {
    method: 'GET',
  });
}
