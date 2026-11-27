import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '../api/client';
import type { UserSummary } from '../api/users';
import { apiKeyKeys, projectKeys, sessionKeys } from './queryKeys';

export const QUERY_STALE_TIME_MS = 30_000;

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;

  if (error instanceof ApiError) {
    return error.status >= 500;
  }

  return error instanceof TypeError;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        staleTime: QUERY_STALE_TIME_MS,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function isAuthenticatedUser(queryClient: QueryClient, userId: string): boolean {
  return queryClient.getQueryData<UserSummary | null>(sessionKeys.all)?.id === userId;
}

export function removeUserScopedQueries(queryClient: QueryClient): void {
  for (const queryKey of [projectKeys.all, apiKeyKeys.all]) {
    void queryClient.cancelQueries({ queryKey });
    queryClient.removeQueries({ queryKey });
  }
}

export const queryClient = createQueryClient();
