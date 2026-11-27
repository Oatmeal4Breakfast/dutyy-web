import { onlineManager } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router';

import App from './App';
import { clearEstablishedSession } from './api/client';
import { apiKeyKeys, projectKeys, sessionKeys } from './queries/queryKeys';
import { makeApiKey, makeProject, makeSession, makeUser } from './test/fixtures';
import { createTestQueryClient, renderWithQueryClient } from './test/renderWithQueryClient';
import { server } from './test/server';

const API = '*/dutyy/api/v1';
const SESSION_EXPIRED_MESSAGE = 'Your session expired. Please log in again.';

function renderApp(path: string, queryClient = createTestQueryClient()) {
  return renderWithQueryClient(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
    { queryClient },
  );
}

describe('App user and session state management', () => {
  beforeEach(() => {
    clearEstablishedSession();
  });

  it('redirects an unauthenticated user from a protected route to login', async () => {
    server.use(
      http.get(`${API}/auth/session`, () =>
        HttpResponse.json({ detail: 'invalid session' }, { status: 401 }),
      ),
    );

    renderApp('/dashboard');

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeVisible();
    expect(screen.queryByText(SESSION_EXPIRED_MESSAGE)).not.toBeInTheDocument();
  });

  it('does not retry a failed startup session restore', async () => {
    let sessionRequests = 0;
    server.use(
      http.get(`${API}/auth/session`, () => {
        sessionRequests += 1;
        return HttpResponse.json({ detail: 'session unavailable' }, { status: 503 });
      }),
    );

    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Dutyy' })).toBeVisible();
    expect(sessionRequests).toBe(1);
  });

  it('treats a paused startup session restore as unauthenticated', async () => {
    onlineManager.setOnline(false);
    const { unmount } = renderApp('/');

    try {
      expect(await screen.findByRole('heading', { name: 'Dutyy' })).toBeVisible();
      expect(screen.queryByText('Checking session...')).not.toBeInTheDocument();
    } finally {
      unmount();
      onlineManager.setOnline(true);
    }
  });

  it('redirects an unauthenticated user from API key settings to login', async () => {
    server.use(
      http.get(`${API}/auth/session`, () =>
        HttpResponse.json({ detail: 'invalid session' }, { status: 401 }),
      ),
    );

    renderApp('/settings/api-keys');

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeVisible();
  });

  it('redirects authenticated settings requests to API key settings', async () => {
    const session = makeSession();
    server.use(
      http.get(`${API}/auth/session`, () =>
        HttpResponse.json(session, {
          headers: { 'X-CSRF-Token': 'test-csrf-token' },
        }),
      ),
      http.get(`${API}/api-keys`, () => HttpResponse.json([])),
    );

    const { queryClient } = renderApp('/settings');

    expect(await screen.findByRole('heading', { name: 'API keys' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveClass('navbar-link--active');
    expect(queryClient.getQueryData(sessionKeys.all)).toEqual(session.user_summary);
  });

  it('redirects an established session to login with an expiration message after a 401', async () => {
    server.use(
      http.get(`${API}/auth/session`, () =>
        HttpResponse.json(makeSession(), {
          headers: { 'X-CSRF-Token': 'test-csrf-token' },
        }),
      ),
      http.get(`${API}/projects`, () =>
        HttpResponse.json({ detail: 'invalid session' }, { status: 401 }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(apiKeyKeys.list('user-1'), [makeApiKey()]);
    renderApp('/dashboard', queryClient);

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent(SESSION_EXPIRED_MESSAGE);
    expect(queryClient.getQueriesData({ queryKey: projectKeys.all })).toEqual([]);
    expect(queryClient.getQueriesData({ queryKey: apiKeyKeys.all })).toEqual([]);
    expect(queryClient.getQueryData(sessionKeys.all)).toBeNull();
  });

  it('shows invalid credentials without treating a login 401 as session expiration', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${API}/auth/session`, () =>
        HttpResponse.json({ detail: 'invalid session' }, { status: 401 }),
      ),
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ detail: 'Invalid username or password' }, { status: 401 }),
      ),
    );

    renderApp('/login');

    await user.type(await screen.findByLabelText('Email'), 'john.doe@example.com');
    await user.type(screen.getByLabelText('Password'), 'incorrect-password');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password');
    expect(screen.queryByText(SESSION_EXPIRED_MESSAGE)).not.toBeInTheDocument();
  });

  it('preserves authentication and protected caches when logout fails', async () => {
    const user = userEvent.setup();
    const session = makeSession();
    const project = makeProject();

    server.use(
      http.get(`${API}/auth/session`, () =>
        HttpResponse.json(session, {
          headers: { 'X-CSRF-Token': 'test-csrf-token' },
        }),
      ),
      http.get(`${API}/projects`, () => HttpResponse.json([project])),
      http.post(`${API}/auth/logout`, () =>
        HttpResponse.json({ detail: 'logout unavailable' }, { status: 503 }),
      ),
    );

    const { queryClient } = renderApp('/dashboard');

    expect(await screen.findByText(project.name)).toBeVisible();
    queryClient.setQueryData(apiKeyKeys.list(session.user_summary.id), [makeApiKey()]);
    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'API request failed with status 503',
    );
    expect(screen.getByText(project.name)).toBeVisible();
    expect(queryClient.getQueryData(projectKeys.list(session.user_summary.id))).toEqual([project]);
    expect(queryClient.getQueryData(apiKeyKeys.list(session.user_summary.id))).toEqual([
      makeApiKey(),
    ]);
    expect(queryClient.getQueryData(sessionKeys.all)).toEqual(session.user_summary);
  });

  it('does not show the previous users projects after an account transition', async () => {
    const user = userEvent.setup();
    const firstUser = makeUser();
    const secondUser = makeUser({
      id: 'user-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
    });
    const firstProject = makeProject({ name: 'First user project' });
    const secondProject = makeProject({
      id: 'project-2',
      name: 'Second user project',
      owner_id: secondUser.id,
      dutyys: [],
    });
    let activeUserId = firstUser.id;

    server.use(
      http.get(`${API}/auth/session`, () =>
        HttpResponse.json(makeSession({ user_summary: firstUser }), {
          headers: { 'X-CSRF-Token': 'test-csrf-token' },
        }),
      ),
      http.get(`${API}/projects`, () =>
        HttpResponse.json(activeUserId === firstUser.id ? [firstProject] : [secondProject]),
      ),
      http.post(`${API}/auth/logout`, () => {
        activeUserId = secondUser.id;
        return new HttpResponse(null, { status: 204 });
      }),
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json(
          { user_summary: secondUser },
          { headers: { 'X-CSRF-Token': 'next-csrf-token' } },
        ),
      ),
    );

    const { queryClient } = renderApp('/dashboard');

    expect(await screen.findByText('First user project')).toBeVisible();
    queryClient.setQueryData(apiKeyKeys.list(firstUser.id), [makeApiKey()]);
    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeVisible();
    expect(screen.queryByText('First user project')).not.toBeInTheDocument();
    expect(queryClient.getQueriesData({ queryKey: projectKeys.all })).toEqual([]);
    expect(queryClient.getQueriesData({ queryKey: apiKeyKeys.all })).toEqual([]);
    expect(queryClient.getQueryData(sessionKeys.all)).toBeNull();

    queryClient.setQueryData(projectKeys.list(firstUser.id), [firstProject]);
    queryClient.setQueryData(apiKeyKeys.list(firstUser.id), [makeApiKey()]);

    await user.type(screen.getByLabelText('Email'), secondUser.email);
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Second user project')).toBeVisible();
    expect(screen.queryByText('First user project')).not.toBeInTheDocument();
    expect(queryClient.getQueryData(projectKeys.list(firstUser.id))).toBeUndefined();
    expect(queryClient.getQueryData(apiKeyKeys.list(firstUser.id))).toBeUndefined();
    expect(queryClient.getQueryData(sessionKeys.all)).toEqual(secondUser);
  });
});
