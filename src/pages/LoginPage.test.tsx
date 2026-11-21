import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import LoginPage from './LoginPage';

function renderLoginPage(sessionExpired: boolean) {
  render(
    <MemoryRouter>
      <LoginPage onLogin={vi.fn()} sessionExpired={sessionExpired} />
    </MemoryRouter>,
  );
}

describe('LoginPage session expiration', () => {
  it('does not display message when session has not expired', () => {
    renderLoginPage(false);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('displays an alert message when the session has expired', () => {
    renderLoginPage(true);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your session expired. Please log in again.',
    );
  });
});
