// Single place to read/write the logged-in user from localStorage.
// Login stores the whole response ({ success, data: {...} }), so unwrap .data if present.

export function getStoredUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const user = raw.data || raw;
    return { ...user, userId: user.userId || user._id };
  } catch {
    return {};
  }
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
