import { ApiError } from '../api/client';
import { makeApiKey, makeUser } from '../test/fixtures';
import {
  createQueryClient,
  isAuthenticatedUser,
  QUERY_STALE_TIME_MS,
  removeUserScopedQueries,
  shouldRetryQuery,
} from './queryClient';
import { apiKeyKeys, projectKeys, sessionKeys } from './queryKeys';

describe('QueryClient defaults', () => {
  it('retries network and server failures at most twice', () => {
    expect(shouldRetryQuery(0, new TypeError('network failure'))).toBe(true);
    expect(shouldRetryQuery(1, new ApiError(503, null))).toBe(true);
    expect(shouldRetryQuery(2, new ApiError(503, null))).toBe(false);
  });

  it('does not retry unexpected application errors', () => {
    expect(shouldRetryQuery(0, new Error('unexpected failure'))).toBe(false);
    expect(shouldRetryQuery(0, new SyntaxError('invalid response'))).toBe(false);
  });

  it('does not retry API client errors below 500', () => {
    expect(shouldRetryQuery(0, new ApiError(400, null))).toBe(false);
    expect(shouldRetryQuery(0, new ApiError(401, null))).toBe(false);
    expect(shouldRetryQuery(0, new ApiError(409, null))).toBe(false);
  });

  it('configures query freshness and disables mutation retries', () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();

    expect(defaults.queries?.retry).toBe(shouldRetryQuery);
    expect(defaults.queries?.staleTime).toBe(QUERY_STALE_TIME_MS);
    expect(defaults.mutations?.retry).toBe(false);

    client.clear();
  });
});

describe('authentication cache helpers', () => {
  it('identifies only the user in the canonical session cache', () => {
    const client = createQueryClient();
    client.setQueryData(sessionKeys.all, makeUser());

    expect(isAuthenticatedUser(client, 'user-1')).toBe(true);
    expect(isAuthenticatedUser(client, 'user-2')).toBe(false);

    client.setQueryData(sessionKeys.all, null);
    expect(isAuthenticatedUser(client, 'user-1')).toBe(false);
    client.clear();
  });

  it('cancels and removes project and API-key queries without removing the session', async () => {
    const client = createQueryClient();
    const sessionUser = makeUser();
    let requestAborted = false;
    client.setQueryData(sessionKeys.all, sessionUser);
    client.setQueryData(apiKeyKeys.list(sessionUser.id), [makeApiKey()]);
    const pendingProjectQuery = client.fetchQuery({
      queryKey: projectKeys.list(sessionUser.id),
      queryFn: ({ signal }) =>
        new Promise<never>((_, reject) => {
          signal.addEventListener('abort', () => {
            requestAborted = true;
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    });

    await Promise.resolve();
    removeUserScopedQueries(client);
    await pendingProjectQuery.catch(() => undefined);

    expect(requestAborted).toBe(true);
    expect(client.getQueriesData({ queryKey: projectKeys.all })).toEqual([]);
    expect(client.getQueriesData({ queryKey: apiKeyKeys.all })).toEqual([]);
    expect(client.getQueryData(sessionKeys.all)).toEqual(sessionUser);
    client.clear();
  });
});
