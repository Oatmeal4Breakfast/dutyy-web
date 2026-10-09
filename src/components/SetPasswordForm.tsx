import { Link } from 'react-router';
import { useState, type SubmitEvent } from 'react';
import { setUserPassword } from '../api/auth';
import { ApiError } from '../api/client';

export default function SetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState<string>('');
  const [linkExpired, setLinkExpired] = useState<boolean>(false);
  const [confirm, setConfirm] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isLongEnough: boolean = password.length >= 12;
  const hasUpper: boolean = /[A-Z]/.test(password);
  const hasNumber: boolean = /[0-9]/.test(password);
  const hasSymbol: boolean = /[^A-Za-z0-9]/.test(password);
  const matches = password === confirm && password !== '';

  const isValid = matches && isLongEnough && hasUpper && hasNumber && hasSymbol;

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    setError(null);
    setSubmitting(true);
    setSuccess(false);

    if (isValid) {
      try {
        await setUserPassword(token, password);
        setSuccess(true);
        setPassword('');
        setConfirm('');
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 400 || error.status === 404 || error.status === 410) {
            setError('This link is invalid or expired. Request a new one');
            setLinkExpired(true);
          } else {
            setError(String(error.getDetail() ?? error.message));
          }
        } else {
          setError('Unable to set password');
        }
      } finally {
        setSubmitting(false);
      }
    } else {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="password" id="password-label">
          {' '}
          Password{' '}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label htmlFor="confirm-password" id="confirm-password-label">
          {' '}
          Confirm Password{' '}
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <ul aria-live="polite">
          <li style={{ color: isLongEnough ? 'green' : 'inherit' }}>
            {isLongEnough ? '✓' : '○'} At least 12 characters
          </li>
          <li style={{ color: hasUpper ? 'green' : 'inherit' }}>
            {hasUpper ? '✓' : '○'} 1 uppercase letter
          </li>
          <li style={{ color: hasNumber ? 'green' : 'inherit' }}>
            {hasNumber ? '✓' : '○'} 1 number
          </li>
          <li style={{ color: hasSymbol ? 'green' : 'inherit' }}>
            {hasSymbol ? '✓' : '○'} 1 symbol
          </li>
          <li style={{ color: matches ? 'green' : 'inherit' }}>{matches ? '✓' : '○'} matches</li>
        </ul>
        <button type="submit" disabled={submitting || !isValid}>
          {' '}
          {submitting ? 'setting password' : 'Set Password'}
        </button>
        {error && <p role="alert">{error}</p>}
        {success && (
          <p role="status">
            Password Set <Link to="/login">Sign in</Link>
          </p>
        )}
        {linkExpired && <Link to="/forgot-password">Request new link</Link>}
      </form>
    </div>
  );
}
