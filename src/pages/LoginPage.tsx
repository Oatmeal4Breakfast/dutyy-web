import { Link } from 'react-router';
import type { UserSummary } from '../api/types';
import LoginForm from '../components/LoginForm';

type LoginPageProps = {
  onLogin: (user: UserSummary) => void;
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <main className="login-page">
      <header className="page-header">
        <p className="page-kicker">Account access</p>
        <h1>Log in</h1>
      </header>

      <section className="auth-panel" aria-label="Log in">
        <LoginForm onLogin={onLogin} />
        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </section>
    </main>
  );
}
