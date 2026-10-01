import { useState, type ReactNode } from 'react';
import type { UserSummary } from './api/types';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import './App.css';

function App() {
  const [user, setUser] = useState<UserSummary | null>(null);

  const [mode, setMode] = useState<'login' | 'signup'>('login');

  let render: ReactNode;

  if (mode === 'login') {
    render = (
      <div className="login-container">
        <LoginForm onLogin={setUser} />
        <p>
          Don&apos;t have an account?{' '}
          <button type="button" onClick={() => setMode('signup')}>
            Sign up
          </button>
        </p>
      </div>
    );
  } else {
    render = (
      <div className="signup-container">
        <SignupForm />
        <p>
          Already have an account?{' '}
          <button type="button" onClick={() => setMode('login')}>
            Log in
          </button>
        </p>
      </div>
    );
  }

  if (!user) {
    return render;
  } else {
    return <p>Welcome {user.first_name}</p>;
  }
}

export default App;
