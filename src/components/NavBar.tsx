import { useState } from 'react';
import { Link } from 'react-router';

import logo from '../assets/brand/logo.svg';
import { logout } from '../api/auth';
import { ApiError } from '../api/client';
import type { UserSummary } from '../api/types';
import './NavBar.css';

type LogoutProps = {
  user: UserSummary | null;
  onLogout: () => void;
};

function LogoutButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="logout-button navbar-button"
      onClick={onClick}
      disabled={disabled}
    >
      {disabled ? 'Logging out...' : 'Logout'}
    </button>
  );
}

function GuestLinks() {
  return (
    <div className="guest-links">
      <Link to="/login" className="navbar-link">
        Login
      </Link>
      <Link to="/signup" className="navbar-cta">
        Create an account
      </Link>
    </div>
  );
}

export default function NavBar({ user, onLogout }: LogoutProps) {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout(): Promise<void> {
    setError(null);
    setSubmitting(true);

    try {
      await logout();
      onLogout();
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Unable to sign out');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="navbar">
      <nav aria-label="Primary navigation">
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="Dutyy" />
        </Link>
        <div className="navbar-actions">
          {user ? (
            <>
              <div className="welcome-user">
                <p>Welcome {user.first_name}</p>
              </div>
              <LogoutButton disabled={submitting} onClick={handleLogout} />
            </>
          ) : (
            <GuestLinks />
          )}
        </div>
      </nav>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
