import { Link, useSearchParams } from 'react-router';
import SetPasswordForm from '../components/SetPasswordForm';

export default function SetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';

  if (!token) {
    return (
      <main className="set-password-page">
        <header className="page-header">
          <p className="page-kicker">Set password</p>
          <h1>Choose a password</h1>
        </header>

        <section className="auth-panel" aria-label="Set password">
          <p role="alert">
            This link is missing. <Link to="/forgot-password">Request a new one</Link> or{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </section>
      </main>
    );
  }
  return (
    <main className="set-password-page">
      <header className="page-header">
        <p className="page-kicker">Set password</p>
        <h1>Choose a password</h1>
      </header>

      <section className="auth-panel" aria-label="Set password">
        <SetPasswordForm token={token} />
      </section>
    </main>
  );
}
