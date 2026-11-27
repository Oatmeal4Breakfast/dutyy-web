import { useQuery } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { getApiKeys } from '../api/api';
import { renderWithQueryClient } from '../test/renderWithQueryClient';
import { server } from '../test/server';
import { apiKeyKeys } from './queryKeys';

const API = '*/dutyy/api/v1';

function ApiKeyQueryConsumer() {
  useQuery({
    queryKey: apiKeyKeys.list('user-1'),
    queryFn: ({ signal }) => getApiKeys(signal),
  });

  return null;
}

describe('query cancellation', () => {
  it('aborts the underlying request when its final consumer unmounts', async () => {
    let requestSignal: AbortSignal | undefined;
    let markRequestStarted!: () => void;
    let releaseRequest!: () => void;
    const requestStarted = new Promise<void>((resolve) => {
      markRequestStarted = resolve;
    });
    const requestGate = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });

    server.use(
      http.get(`${API}/api-keys`, async ({ request }) => {
        requestSignal = request.signal;
        markRequestStarted();
        await requestGate;
        return HttpResponse.json([]);
      }),
    );

    const { unmount } = renderWithQueryClient(<ApiKeyQueryConsumer />);

    await requestStarted;

    try {
      expect(requestSignal?.aborted).toBe(false);
      unmount();

      await waitFor(() => expect(requestSignal?.aborted).toBe(true));
    } finally {
      releaseRequest();
    }
  });
});
