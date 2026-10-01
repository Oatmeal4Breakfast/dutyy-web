import { useState, type SubmitEvent } from 'react';
import { login } from '../api/auth';
import type { UserSummary } from '../api/types';
import { ApiError } from '../api/client';

type LoginFormProps = {
  onLogin: (user: UserSummary) => void;
};

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cleanEmail = email.trim();

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);
    setSubmitting(true);

    try {
      const response = await login(cleanEmail, password);
      onLogin(response.user_summary);
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Unable to sign in');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email" id="email-label">
          {' '}
          Email{' '}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="password" id="password-label">
          {' '}
          Password{' '}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={submitting}>
          {' '}
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </div>
  );
}
