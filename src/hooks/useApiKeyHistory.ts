import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteAPIKey, getApiKeys, type APIKeyResponse } from '../api/api';
import { ApiError } from '../api/client';

type HistoryLoadResult = 'success' | 'failed' | 'superseded';

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

export default function useApiKeyHistory() {
  const [keys, setKeys] = useState<APIKeyResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [revokingIds, setRevokingIds] = useState<Set<string>>(() => new Set());
  const requestSequence = useRef<number>(0);

  const executeLoad = useCallback(
    async (
      requestId: number,
      mode: 'initial' | 'refresh',
      failureMessage: string,
    ): Promise<HistoryLoadResult> => {
      try {
        const results = await getApiKeys();

        if (requestId !== requestSequence.current) {
          return 'superseded';
        }

        setKeys(sortNewestFirst(results));
        return 'success';
      } catch (error) {
        if (requestId !== requestSequence.current) {
          return 'superseded';
        }

        if (mode === 'initial') {
          setLoadError(getErrorMessage(error, 'Unable to load API keys'));
        } else {
          setRefreshError(failureMessage);
        }
        return 'failed';
      } finally {
        if (requestId === requestSequence.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [],
  );

  const loadKeys = useCallback(
    (
      mode: 'initial' | 'refresh',
      failureMessage = 'Unable to refresh API key history.',
    ): Promise<HistoryLoadResult> => {
      const requestId = ++requestSequence.current;

      if (mode === 'initial') {
        setLoading(true);
        setRefreshing(false);
      } else {
        setLoading(false);
        setRefreshing(true);
      }
      setLoadError(null);
      setRefreshError(null);

      return executeLoad(requestId, mode, failureMessage);
    },
    [executeLoad],
  );

  useEffect(() => {
    const requestId = ++requestSequence.current;
    void executeLoad(requestId, 'initial', 'Unable to load API keys');

    return () => {
      requestSequence.current += 1;
    };
  }, [executeLoad]);

  const retry = useCallback(() => loadKeys('initial'), [loadKeys]);

  const refresh = useCallback(
    (failureMessage?: string) => loadKeys('refresh', failureMessage),
    [loadKeys],
  );

  const revoke = useCallback(
    async (key: APIKeyResponse): Promise<void> => {
      setRevokeError(null);
      setRevokingIds((current) => new Set(current).add(key.id));

      try {
        await deleteAPIKey(key.id);
        setKeys((current) =>
          current.map((currentKey) =>
            currentKey.id === key.id ? { ...currentKey, status: 'inactive' } : currentKey,
          ),
        );
        await refresh('The API key was revoked, but the key history could not be refreshed.');
      } catch (error) {
        setRevokeError(getErrorMessage(error, 'Unable to revoke API key'));
      } finally {
        setRevokingIds((current) => {
          const next = new Set(current);
          next.delete(key.id);
          return next;
        });
      }
    },
    [refresh],
  );

  return {
    keys,
    loading,
    refreshing,
    loadError,
    refreshError,
    revokeError,
    revokingIds,
    retry,
    refresh,
    revoke,
  };
}
