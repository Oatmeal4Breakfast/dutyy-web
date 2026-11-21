import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router';

import App from './App';
import { clearEstablishedSession } from './api/client';
import { makeSession } from './test/fixtures';
import { server } from './test/server';

const API = '*/dutyy/api/v1';
const SESSION_EXPIRED_MESSAGE = 'Your session expired. Please log in again.';

function renderApp(path: string) {
  render(
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
});
