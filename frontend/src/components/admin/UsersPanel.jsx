import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorBox from '../common/ErrorBox';
import EditProfile from '../profile/EditProfile';
import VerifiedBadge from '../common/VerifiedBadge';
import { AvatarDisplay } from '../../utils/avatarGenerator';
import { getStoredUser } from '../../utils/session';
import { api } from '../../services/api';
import { useConfirm } from '../../context/ConfirmContext';

function UsersPanel() {
  const confirm = useConfirm();
  const myId = getStoredUser().userId;
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  // Debounced server-side filter
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      api(`/api/admin/users?q=${encodeURIComponent(query.trim())}`)
        .then((d) => active && setUsers(d.users))
        .catch((err) => active && setError(err.message))
        .finally(() => active && setLoading(false));
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query]);

  const remove = async (user) => {
    if (!(await confirm({
      title: `Delete @${user.username}?`,
      message: `This permanently deletes ${user.name}'s account, ${user.postCount} post(s), albums, comments and friendships.`,
      confirmLabel: 'Delete user',
      danger: true,
    }))) return;
    setError('');
    try {
      await api(`/api/admin/users/${user._id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="admin-user-search" className="field-label">Find a user</label>
        <input id="admin-user-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, username or email" className="field-input" />
      </div>
      <ErrorBox message={error} />

      {loading ? (
        <p className="text-sm text-slate-400">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-slate-400">No users found.</p>
      ) : (
        <ul className="divide-y divide-slate-800 bg-slate-900 border border-slate-800 rounded-xl">
          {users.map((u) => (
            <li key={u._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3">
              <Link to={`/profile/${u._id}`} className="flex items-center gap-3 min-w-0 flex-1 group">
                <AvatarDisplay username={u.name} src={u.profileImage} className="w-10 h-10 text-xs shrink-0" />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-100 group-hover:text-indigo-300">
                    <span className="truncate">{u.name}</span>
                    <VerifiedBadge user={u} />
                    {u.role === 'admin' && <span className="text-[9px] uppercase tracking-wider bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">Admin</span>}
                  </span>
                  <span className="block text-xs text-slate-500 truncate">@{u.username} · {u.email} · {u.postCount} posts</span>
                </span>
              </Link>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => setEditing(u)} className="btn btn-secondary">Edit</button>
                <button type="button" onClick={() => remove(u)} disabled={u._id === myId}
                  title={u._id === myId ? 'Delete your own account from your profile page' : undefined}
                  className="btn btn-ghost-danger">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <EditProfile user={editing} adminMode onHide={() => setEditing(null)}
          onUpdated={(updated) => setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, ...updated } : u)))} />
      )}
    </div>
  );
}

export default UsersPanel;
