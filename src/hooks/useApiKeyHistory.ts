import { useCallback, useState } from 'react';
import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteAPIKey, getApiKeys, type APIKeyResponse } from '../api/api';
import { ApiError } from '../api/client';
import { apiKeyKeys } from '../queries/queryKeys';

type HistoryLoadResult = 'success' | 'failed';

type RefreshFailure = {
  errorUpdatedAt: number;
  message: string;
};

const REVOKE_REFRESH_ERROR = 'The API key was revoked, but the key history could not be refreshed.';

function sortNewestFirst(keys: APIKeyResponse[]): APIKeyResponse[] {
  return [...keys].sort(
    (left, right) => new Date(right.created_date).getTime() - new Date(left.created_date).getTime(),
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;

  const detail = error.getDetail();
  return detail ? String(detail) : error.message;
}

function revokeMutationKey(userId: string) {
  return [...apiKeyKeys.byUser(userId), 'revoke'] as const;
}

export default function useApiKeyHistory(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = apiKeyKeys.list(userId);
  const [refreshFailure, setRefreshFailure] = useState<RefreshFailure | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const historyQuery = useQuery({
    queryKey,
    queryFn: ({ signal }) => getApiKeys(signal),
    select: sortNewestFirst,
  });

  const refresh = useCallback(
    async (failureMessage = 'Unable to refresh API key history.'): Promise<HistoryLoadResult> => {
      setRefreshFailure(null);
      await queryClient.cancelQueries({ queryKey, exact: true });

      const result = await historyQuery.refetch();
      if (result.isError) {
        setRefreshFailure({
          errorUpdatedAt: result.errorUpdatedAt,
          message: failureMessage,
        });
        return 'failed';
      }

      return 'success';
    },
    [historyQuery, queryClient, queryKey],
  );

  const retry = useCallback(async (): Promise<HistoryLoadResult> => {
    setRefreshFailure(null);
    const result = await historyQuery.refetch();
    return result.isError ? 'failed' : 'success';
  }, [historyQuery]);

  const revokeMutation = useMutation({
    mutationKey: revokeMutationKey(userId),
    mutationFn: (key: APIKeyResponse) => deleteAPIKey(key.id),
    onMutate: () => {
      setRevokeError(null);
    },
    onSuccess: (_, key) => {
      queryClient.setQueryData<APIKeyResponse[]>(queryKey, (current) =>
        current?.map((currentKey) =>
          currentKey.id === key.id ? { ...currentKey, status: 'inactive' } : currentKey,
        ),
      );
      void refresh(REVOKE_REFRESH_ERROR);
    },
    onError: (error) => {
      setRevokeError(getErrorMessage(error, 'Unable to revoke API key'));
    },
  });

  const pendingRevocationIds = useMutationState({
    filters: {
      mutationKey: revokeMutationKey(userId),
      status: 'pending',
    },
    select: (mutation) => (mutation.state.variables as APIKeyResponse).id,
  });

  const revoke = useCallback(
    async (key: APIKeyResponse): Promise<void> => {
      try {
        await revokeMutation.mutateAsync(key);
      } catch {
        // The mutation callback exposes the error through the hook's existing UI contract.
      }
    },
    [revokeMutation],
  );

  const loading = historyQuery.data === undefined && historyQuery.isFetching;
  const loadError =
    !loading && historyQuery.data === undefined && historyQuery.error
      ? getErrorMessage(historyQuery.error, 'Unable to load API keys')
      : null;
  const backgroundQueryError =
    historyQuery.data !== undefined && historyQuery.error
      ? refreshFailure?.errorUpdatedAt === historyQuery.errorUpdatedAt
        ? refreshFailure.message
        : getErrorMessage(historyQuery.error, 'Unable to refresh API key history.')
      : null;

  return {
    keys: historyQuery.data ?? [],
    loading,
    refreshing: historyQuery.data !== undefined && historyQuery.isFetching,
    loadError,
    refreshError: backgroundQueryError,
    revokeError,
    revokingIds: new Set(pendingRevocationIds),
    retry,
    refresh,
    revoke,
  };
}
