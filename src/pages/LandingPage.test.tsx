import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import LandingPage from './LandingPage';

describe('LandingPage', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
  });

  it('presents the product and its workflow demo', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Dutyy' })).toBeInTheDocument();
    expect(
      screen.getByText('Organize projects and keep track of the work that moves them forward.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/yes, we made another to-do app/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Dutyy dashboard/ })).toBeInTheDocument();
    expect(screen.getByLabelText('A dutyy being edited and marked complete')).toBeInTheDocument();
  });
});
