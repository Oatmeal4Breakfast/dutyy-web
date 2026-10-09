import { Link } from 'react-router';
import ForgotPasswordForm from '../components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <main className="forgot-password-page">
      <header className="page-header">
        <p className="page-kicker">Reset Password</p>
        <h1>Reset Password</h1>
      </header>

      <section className="auth-panel" aria-label="Forgot password">
        <ForgotPasswordForm />
        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </section>
    </main>
  );
}
