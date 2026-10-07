import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { restoreSession } from './api/auth';
import type { UserSummary } from './api/types';
import NavBar from './components/NavBar';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import './App.css';

function App() {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const session = await restoreSession();
        if (active) setUser(session.user_summary);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  if (checkingSession) {
    return (
      <p className="session-status" role="status">
        Checking session...
      </p>
    );
  }

  return (
    <>
      <NavBar user={user} onLogout={() => setUser(null)} />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={setUser} />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />}
        />
        <Route
          path="/dashboard"
          element={user ? <DashboardPage user={user} /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
