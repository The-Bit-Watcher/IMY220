// Single place to read/write the logged-in user and token in localStorage.

export function getStoredUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const user = raw.data || raw;
    return { ...user, userId: user.userId || user._id };
  } catch {
    return {};
  }
}

export function isLoggedIn() {
  return !!localStorage.getItem('token') && !!getStoredUser().userId;
}

export function isAdmin() {
  return getStoredUser().role === 'admin';
}

// Called after login / sign-up with the backend's session payload
export function saveSession(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('currentUser', JSON.stringify(data));
  window.dispatchEvent(new Event('currentUserUpdated'));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
}

export function updateStoredUser(fields) {
  const current = getStoredUser();
  const next = { ...current, ...fields, userId: current.userId };
  localStorage.setItem('currentUser', JSON.stringify(next));
  // Let the Header (and anything else listening) re-read the user
  window.dispatchEvent(new Event('currentUserUpdated'));
  return next;
}

export function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
