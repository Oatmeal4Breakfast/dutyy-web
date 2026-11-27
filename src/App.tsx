import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, Route, Routes } from 'react-router';
import './App.css';
import { restoreSession } from './api/auth';
import { registerSessionExpiredHandler } from './api/client';
import type { UserSummary } from './api/users';
import NavBar from './components/NavBar';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import SetPasswordPage from './pages/SetPasswordPage';
import ApiKeysPage from './pages/ApiKeysPage';
import { removeUserScopedQueries } from './queries/queryClient';
import { sessionKeys } from './queries/queryKeys';

function App() {
  const queryClient = useQueryClient();
  const [sessionExpired, setSessionExpired] = useState(false);
  const sessionQuery = useQuery({
    queryKey: sessionKeys.all,
    queryFn: async ({ signal }) => (await restoreSession(signal)).user_summary,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const user = sessionQuery.data ?? null;
  const checkingSession = sessionQuery.isPending && sessionQuery.fetchStatus !== 'paused';

  useEffect(() => {
    return registerSessionExpiredHandler(() => {
      removeUserScopedQueries(queryClient);
      queryClient.setQueryData<UserSummary | null>(sessionKeys.all, null);
      setSessionExpired(true);
    });
  }, [queryClient]);

  if (checkingSession) {
    return (
      <p className="session-status" role="status">
        Checking session...
      </p>
    );
  }

  function handleLogin(user: UserSummary) {
    removeUserScopedQueries(queryClient);
    queryClient.setQueryData(sessionKeys.all, user);
    setSessionExpired(false);
  }

  function handleLogout() {
    removeUserScopedQueries(queryClient);
    queryClient.setQueryData<UserSummary | null>(sessionKeys.all, null);
  }

  return (
    <>
      <NavBar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage onLogin={handleLogin} sessionExpired={sessionExpired} />
            )
          }
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />}
        />
        <Route
          path="/dashboard"
          element={user ? <DashboardPage userId={user.id} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/settings"
          element={
            user ? <Navigate to="/settings/api-keys" replace /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/settings/api-keys"
          element={user ? <ApiKeysPage userId={user.id} /> : <Navigate to="/login" replace />}
        />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
