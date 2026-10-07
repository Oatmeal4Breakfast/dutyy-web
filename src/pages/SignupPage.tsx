import { Link } from 'react-router';
import SignupForm from '../components/SignupForm';

export default function SignupPage() {
  return (
    <main className="signup-page">
      <header className="page-header">
        <p className="page-kicker">New account</p>
        <h1>Create an account</h1>
      </header>

      <section className="auth-panel" aria-label="Create an account">
        <SignupForm />
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
