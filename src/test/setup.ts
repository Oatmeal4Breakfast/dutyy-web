import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { server } from './server';

const nativeFetch = globalThis.fetch;

globalThis.fetch = (input: string | URL | Request, init?: RequestInit) => {
  const resolvedInput =
    typeof input === 'string' && input.startsWith('/')
      ? new URL(input, window.location.origin)
      : input;
  return nativeFetch(resolvedInput, init);
};

if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
}

if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.restoreAllMocks();
});

afterAll(() => server.close());
