import { Link, useSearchParams } from 'react-router';
import { SetPasswordForm } from '../components/SetPasswordForm';

export default function SetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';

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
