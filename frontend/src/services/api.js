import { authHeaders, clearSession } from '../utils/session';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// One wrapper around the native Fetch API for every backend call.
// - sends the JWT and JSON body
// - throws ApiError with the server's message on failure
// - on 401 (session expired / account deleted) clears the session and tells the app to go to the splash page.
//   403 means "logged in but not allowed" and is just an error, not a logout.
export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: authHeaders(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && localStorage.getItem('token')) {
    clearSession();
    window.dispatchEvent(new Event('sessionExpired'));
  }
  if (!res.ok || data.success === false) {
    throw new ApiError(data.message || `Request failed (${res.status}).`, res.status);
  }
  return data;
}
