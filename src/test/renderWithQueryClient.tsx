import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: Number.POSITIVE_INFINITY,
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

type QueryRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  queryClient?: QueryClient;
};

type QueryRenderResult = RenderResult & {
  queryClient: QueryClient;
};

export function renderWithQueryClient(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...options }: QueryRenderOptions = {},
): QueryRenderResult {
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}
