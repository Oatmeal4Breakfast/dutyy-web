import { ApiError } from '../api/client';
import { createQueryClient, QUERY_STALE_TIME_MS, shouldRetryQuery } from './queryClient';

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
