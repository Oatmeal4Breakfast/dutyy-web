import { useState, type SubmitEvent } from 'react';
import { createUser, type UserSignUpRequest } from '../api/users';
import { ApiError } from '../api/client';

export default function SignupForm() {
  const [formData, setFormData] = useState<UserSignUpRequest>({
    first_name: '',
    last_name: '',
    email: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const cleanedData: UserSignUpRequest = {
    first_name: formData.first_name.trim(),
    last_name: formData.last_name.trim(),
    email: formData.email.trim(),
  };

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await createUser(cleanedData);
      setSuccess('Account created. Check your email');
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Unable to submit signup form');
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
          value={formData.email}
          onChange={(e) =>
            setFormData({
              ...formData,
              email: e.target.value,
            })
          }
          required
        />
        <label htmlFor="firstName" id="firstName-label">
          {' '}
          First Name{' '}
        </label>
        <input
          id="firstName"
          type="text"
          value={formData.first_name}
          onChange={(e) =>
            setFormData({
              ...formData,
              first_name: e.target.value,
            })
          }
          required
        />
        <label htmlFor="lastName" id="lastName-label">
          {' '}
          Last Name{' '}
        </label>
        <input
          id="lastName"
          type="text"
          value={formData.last_name}
          required
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
        />
        <button type="submit" disabled={submitting}>
          {' '}
          {submitting ? 'Creating User...' : 'Create User'}
        </button>
        {error && <p role="alert">{error}</p>}
        {success && <p role="status">{success}</p>}
      </form>
    </div>
  );
}
