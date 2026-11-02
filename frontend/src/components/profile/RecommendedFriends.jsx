import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AvatarDisplay } from '../../utils/avatarGenerator';
import { api } from '../../services/api';

function RecommendedFriends({ onFriendshipChange }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState({});

  useEffect(() => {
    let active = true;
    api('/api/friends/recommendations?limit=5')
      .then((data) => active && setUsers(data.users))
      .catch(() => active && setUsers([]))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const sendRequest = async (userId) => {
    setRequested((prev) => ({ ...prev, [userId]: 'sending' }));
    try {
      const data = await api(`/api/friends/request/${userId}`, { method: 'POST' });
      setRequested((prev) => ({ ...prev, [userId]: data.relationshipStatus === 'friends' ? 'friends' : 'sent' }));
      // If they had already requested you, the backend makes you friends straight away
      if (data.relationshipStatus === 'friends') onFriendshipChange?.();
    } catch {
      setRequested((prev) => ({ ...prev, [userId]: 'error' }));
    }
  };

  const labels = { sent: 'Requested', friends: 'Friends', sending: '...', error: 'Retry' };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h2 className="font-bold text-slate-200 text-sm mb-3">People you may know</h2>

      {loading ? (
        <p className="text-xs text-slate-500">Loading suggestions...</p>
      ) : users.length === 0 ? (
        <p className="text-xs text-slate-500">No suggestions right now.</p>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => {
            const state = requested[user._id];
            return (
              <li key={user._id} className="flex items-center gap-3">
                <Link to={`/profile/${user._id}`} className="flex items-center gap-3 min-w-0 flex-1 group">
                  <AvatarDisplay username={user.name || user.username} src={user.profileImage} className="w-9 h-9 shrink-0 text-xs" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-200 truncate group-hover:text-indigo-300">{user.name}</span>
                    <span className="block text-[10px] text-slate-500 truncate">
                      {user.mutualFriends > 0 ? `${user.mutualFriends} mutual friend${user.mutualFriends > 1 ? 's' : ''}` : `@${user.username}`}
                    </span>
                  </span>
                </Link>
                <button type="button" onClick={() => sendRequest(user._id)}
                  disabled={state === 'sending' || state === 'sent' || state === 'friends'}
                  aria-label={`Send friend request to ${user.name}`}
                  className={`shrink-0 btn !px-2.5 !py-1 !text-[11px] ${state === 'error' ? 'btn-ghost-danger' : state ? 'btn-secondary' : 'btn-primary'}`}>
                  {labels[state] || '+ Add'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default RecommendedFriends;
