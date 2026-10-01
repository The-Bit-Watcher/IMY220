import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authHeaders } from '../../utils/session';

// Permanently deletes the account. Requires typing the username AND the password.
function DeleteAccountModal({ username, onHide }) {
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !deleting && onHide();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onHide, deleting]);

  const canDelete = confirmText === username && password.length > 0 && !deleting;

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!canDelete) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch('/api/profile/me', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not delete account.');

      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !deleting && onHide()}>
      <form onSubmit={handleDelete} className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden text-left">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-rose-400">Delete account</h3>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <p className="text-slate-300">This permanently deletes:</p>
          <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1">
            <li>your profile and login</li>
            <li>all your posts, and the comments and reports on them</li>
            <li>all your albums</li>
            <li>every comment and like you left on other people's posts</li>
            <li>your friendships, favourites and friend requests</li>
          </ul>
          <p className="text-xs text-rose-300 font-semibold">This cannot be undone.</p>

          {error && <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 text-xs rounded-lg">{error}</div>}

          <div>
            <label className="block text-xs text-slate-300 mb-1.5">
              Type <span className="font-mono text-white">{username}</span> to confirm
            </label>
            <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <button type="button" onClick={onHide} disabled={deleting}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300">Cancel</button>
          <button type="submit" disabled={!canDelete}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed">
            {deleting ? 'Deleting...' : 'Delete my account'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DeleteAccountModal;
