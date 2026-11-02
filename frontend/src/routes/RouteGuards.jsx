import { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { isAdmin, isLoggedIn } from '../utils/session';

// Unregistered visitors may only see the splash page
export function RequireAuth() {
  return isLoggedIn() ? <Outlet /> : <Navigate to="/" replace />;
}

// Admin-only pages. The backend enforces this too; this just keeps the UI honest.
export function RequireAdmin() {
  if (!isLoggedIn()) return <Navigate to="/" replace />;
  return isAdmin() ? <Outlet /> : <Navigate to="/home" replace />;
}

// The splash page is for logged-out visitors only
export function GuestOnly() {
  return isLoggedIn() ? <Navigate to="/home" replace /> : <Outlet />;
}

// When any API call gets a 401 the session is cleared and we go back to the splash page
export function SessionWatcher() {
  const navigate = useNavigate();
  useEffect(() => {
    const onExpired = () => navigate('/', { replace: true });
    window.addEventListener('sessionExpired', onExpired);
    return () => window.removeEventListener('sessionExpired', onExpired);
  }, [navigate]);
  return null;
}
