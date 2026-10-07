import { useState } from 'react';

import { logout } from '../api/auth';
import { ApiError } from '../api/client';
import type { UserSummary } from '../api/types';

type LogoutProps = {
  user: UserSummary | null;
  onLogout: () => void;
};

function LogoutButton({ btnStatus, onClick }: { btnStatus: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="logout-button navbar-button"
      onClick={onClick}
      disabled={btnStatus}
    >
      Logout
    </button>
  );
}

function LoginLink() {
  return (
    <div className="login-div">
      <a href="/login">Login</a>
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
      <nav>
        {user ? <div className='welcome-user'><p>Welcome {user.first_name}</p></div> <LogoutButton btnStatus={submitting} onClick={handleLogout} /> : <LoginLink />}
      </nav>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
