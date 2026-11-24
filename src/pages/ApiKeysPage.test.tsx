import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { makeApiKey } from '../test/fixtures';
import { server } from '../test/server';
import ApiKeysPage from './ApiKeysPage';

const API = '*/dutyy/api/v1';
const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

describe('ApiKeysPage', () => {
  afterEach(() => {
    if (originalClipboardDescriptor) {
      Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  it('shows active, expired, and revoked key history', async () => {
    server.use(
      http.get(`${API}/api-keys`, () =>
        HttpResponse.json([
          makeApiKey(),
          makeApiKey({
            id: 'api-key-2',
            name: 'Old laptop',
            expires_at: '2000-01-01T00:00:00Z',
          }),
          makeApiKey({
            id: 'api-key-3',
            name: 'Revoked key',
            status: 'inactive',
          }),
        ]),
      ),
    );

    render(<ApiKeysPage />);

    expect(await screen.findByText('Laptop CLI')).toBeVisible();
    expect(screen.getByText('Old laptop')).toBeVisible();
    expect(screen.getByText('Revoked key')).toBeVisible();
    expect(screen.getByText('Active')).toBeVisible();
    expect(screen.getByText('Expired')).toBeVisible();
    expect(screen.getByText('Revoked')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Revoke Laptop CLI' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Revoke Old laptop' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Revoke Revoked key' })).not.toBeInTheDocument();
  });

  it('issues and copies a key that is shown until acknowledged', async () => {
    const user = userEvent.setup();
    const clipboardWrite = vi.fn().mockResolvedValue(undefined);
    const issuedSummary = makeApiKey({ id: 'api-key-new', name: 'Desktop CLI' });
    let listRequests = 0;
    let requestBody: unknown;

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    });

    server.use(
      http.get(`${API}/api-keys`, () => {
        listRequests += 1;
        return HttpResponse.json(listRequests === 1 ? [] : [issuedSummary]);
      }),
      http.post(`${API}/api-keys`, async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({ 'api-key': 'dty_one-time-secret' }, { status: 201 });
      }),
    );

    render(<ApiKeysPage />);

    await screen.findByText('No API keys have been issued yet.');
    await user.type(screen.getByLabelText('Key name'), '  Desktop CLI  ');
    await user.selectOptions(screen.getByLabelText('Expires after'), '90d');
    await user.click(screen.getByRole('button', { name: 'Issue key' }));

    expect(await screen.findByDisplayValue('dty_one-time-secret')).toBeVisible();
    expect(requestBody).toEqual({ key_name: 'Desktop CLI', ttl: '90d' });
    expect(await screen.findByText('Desktop CLI')).toBeVisible();
    expect(screen.getByLabelText('Key name')).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Copy key' }));

    expect(clipboardWrite).toHaveBeenCalledWith('dty_one-time-secret');
    expect(screen.getByRole('status')).toHaveTextContent('API key copied.');

    await user.click(screen.getByRole('button', { name: 'I saved this key' }));

    expect(screen.queryByDisplayValue('dty_one-time-secret')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Key name')).toBeEnabled();
  });

  it('keeps the issued secret visible when refreshing history fails', async () => {
    const user = userEvent.setup();
    let listRequests = 0;

    server.use(
      http.get(`${API}/api-keys`, () => {
        listRequests += 1;
        return listRequests === 1
          ? HttpResponse.json([])
          : HttpResponse.json({ detail: 'database unavailable' }, { status: 503 });
      }),
      http.post(`${API}/api-keys`, () =>
        HttpResponse.json({ 'api-key': 'dty_preserved-secret' }, { status: 201 }),
      ),
    );

    render(<ApiKeysPage />);

    await screen.findByText('No API keys have been issued yet.');
    await user.type(screen.getByLabelText('Key name'), 'CI');
    await user.click(screen.getByRole('button', { name: 'Issue key' }));

    expect(await screen.findByDisplayValue('dty_preserved-secret')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The API key was issued, but the key history could not be refreshed.',
    );
  });

  it('ignores an older history response when issuance refreshes the list', async () => {
    const user = userEvent.setup();
    const issuedSummary = makeApiKey({ id: 'api-key-new', name: 'Concurrent CLI' });
    let listRequests = 0;
    let initialRequestSettled = false;
    let releaseInitialRequest: (() => void) | undefined;
    let markInitialRequestStarted: (() => void) | undefined;
    const initialRequestGate = new Promise<void>((resolve) => {
      releaseInitialRequest = resolve;
    });
    const initialRequestStarted = new Promise<void>((resolve) => {
      markInitialRequestStarted = resolve;
    });

    server.use(
      http.get(`${API}/api-keys`, async () => {
        listRequests += 1;

        if (listRequests === 1) {
          markInitialRequestStarted?.();
          await initialRequestGate;
          initialRequestSettled = true;
          return HttpResponse.json([]);
        }

        return HttpResponse.json([issuedSummary]);
      }),
      http.post(`${API}/api-keys`, () =>
        HttpResponse.json({ 'api-key': 'dty_concurrent-secret' }, { status: 201 }),
      ),
    );

    render(<ApiKeysPage />);

    expect(screen.getByRole('heading', { name: 'Issue an API key' })).toBeVisible();
    await initialRequestStarted;
    await user.type(screen.getByLabelText('Key name'), 'Concurrent CLI');
    await user.click(screen.getByRole('button', { name: 'Issue key' }));

    expect(await screen.findByText('Concurrent CLI')).toBeVisible();

    releaseInitialRequest?.();
    await waitFor(() => expect(initialRequestSettled).toBe(true));

    expect(screen.getByText('Concurrent CLI')).toBeVisible();
    expect(screen.queryByText('No API keys have been issued yet.')).not.toBeInTheDocument();
  });

  it('clears an earlier load error after a successful issuance refresh', async () => {
    const user = userEvent.setup();
    const issuedSummary = makeApiKey({ id: 'api-key-new', name: 'Recovery CLI' });
    let listRequests = 0;

    server.use(
      http.get(`${API}/api-keys`, () => {
        listRequests += 1;
        return listRequests === 1
          ? HttpResponse.json({ detail: 'database unavailable' }, { status: 503 })
          : HttpResponse.json([issuedSummary]);
      }),
      http.post(`${API}/api-keys`, () =>
        HttpResponse.json({ 'api-key': 'dty_recovery-secret' }, { status: 201 }),
      ),
    );

    render(<ApiKeysPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('database unavailable');
    await user.type(screen.getByLabelText('Key name'), 'Recovery CLI');
    await user.click(screen.getByRole('button', { name: 'Issue key' }));

    expect(await screen.findByText('Recovery CLI')).toBeVisible();
    expect(screen.queryByText('database unavailable')).not.toBeInTheDocument();
  });

  it('explains an active-name conflict without showing a secret', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${API}/api-keys`, () => HttpResponse.json([])),
      http.post(`${API}/api-keys`, () =>
        HttpResponse.json({ detail: 'API key name already exists' }, { status: 409 }),
      ),
    );

    render(<ApiKeysPage />);

    await screen.findByText('No API keys have been issued yet.');
    await user.type(screen.getByLabelText('Key name'), 'Laptop CLI');
    await user.click(screen.getByRole('button', { name: 'Issue key' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An active API key already uses that name.',
    );
    expect(screen.queryByRole('heading', { name: 'Your new API key' })).not.toBeInTheDocument();
  });

  it('confirms and revokes an active key while retaining its history', async () => {
    const user = userEvent.setup();
    const activeKey = makeApiKey();
    const revokedKey = makeApiKey({ status: 'inactive' });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    let listRequests = 0;
    let revokedId: string | undefined;

    server.use(
      http.get(`${API}/api-keys`, () => {
        listRequests += 1;
        return HttpResponse.json(listRequests === 1 ? [activeKey] : [revokedKey]);
      }),
      http.delete(`${API}/api-keys/:keyId`, ({ params }) => {
        revokedId = String(params.keyId);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    render(<ApiKeysPage />);

    await user.click(await screen.findByRole('button', { name: 'Revoke Laptop CLI' }));

    expect(confirm).toHaveBeenCalledWith(
      'Revoke "Laptop CLI"? This key will stop working immediately and cannot be restored.',
    );
    expect(await screen.findByText('Revoked')).toBeVisible();
    expect(revokedId).toBe('api-key-1');
    expect(screen.getByText('Laptop CLI')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Revoke Laptop CLI' })).not.toBeInTheDocument();
  });
});
