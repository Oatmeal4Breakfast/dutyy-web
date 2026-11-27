import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router';

import App from './App';
import { clearEstablishedSession } from './api/client';
import { makeProject, makeSession, makeUser } from './test/fixtures';
import { renderWithQueryClient } from './test/renderWithQueryClient';
import { server } from './test/server';

const API = '*/dutyy/api/v1';
const SESSION_EXPIRED_MESSAGE = 'Your session expired. Please log in again.';

function renderApp(path: string) {
  renderWithQueryClient(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
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
    server.use(
      http.get(`${API}/auth/session`, () =>
        HttpResponse.json(makeSession(), {
          headers: { 'X-CSRF-Token': 'test-csrf-token' },
        }),
      ),
      http.get(`${API}/api-keys`, () => HttpResponse.json([])),
    );

    renderApp('/settings');

    expect(await screen.findByRole('heading', { name: 'API keys' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveClass('navbar-link--active');
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

    renderApp('/dashboard');

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent(SESSION_EXPIRED_MESSAGE);
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

    renderApp('/dashboard');

    expect(await screen.findByText('First user project')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeVisible();
    expect(screen.queryByText('First user project')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Email'), secondUser.email);
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Second user project')).toBeVisible();
    expect(screen.queryByText('First user project')).not.toBeInTheDocument();
  });
});
