import { useState, type SubmitEvent } from 'react';
import { resetPassword } from '../api/auth';
import { ApiError } from '../api/client';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    setError(null);
    setSubmitting(true);

    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setError(String(error.getDetail() ?? error.message));
      } else {
        setError('Unable to reset password');
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
        <button type="submit" disabled={submitting}>
          {' '}
          {submitting ? 'Submitting...' : 'Reset Password'}
        </button>
        {error && <p role="alert">{error}</p>}
        {sent && <p role="status">If an account exists for that email, check your inbox.</p>}
      </form>
    </div>
  );
}
