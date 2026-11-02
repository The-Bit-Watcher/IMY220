import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import ErrorBox from '../common/ErrorBox';
import { api } from '../../services/api';
import { clearSession } from '../../utils/session';

// Permanently deletes your own account. Requires typing the username AND the password.
function DeleteAccountModal({ username, onHide }) {
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canDelete = confirmText === username && password.length > 0 && !deleting;

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!canDelete) return;
    setDeleting(true);
    setError('');
    try {
      await api('/api/profile/me', { method: 'DELETE', body: { password } });
      clearSession();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  return (
    <Modal title="Delete account" onClose={onHide} busy={deleting} danger>
      <form onSubmit={handleDelete}>
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

          <ErrorBox message={error} />

          <div>
            <label htmlFor="delete-confirm" className="field-label">
              Type <span className="font-mono text-slate-50">{username}</span> to confirm
            </label>
            <input id="delete-confirm" type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" className="field-input" />
          </div>
          <div>
            <label htmlFor="delete-password" className="field-label">Password</label>
            <input id="delete-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="field-input" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <button type="button" onClick={onHide} disabled={deleting} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={!canDelete} className="btn btn-danger">{deleting ? 'Deleting...' : 'Delete my account'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default DeleteAccountModal;
