import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarDisplay } from '../../utils/avatarGenerator';
import { authHeaders } from '../../utils/session';

function RecommendedFriends({ onFriendshipChange }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState({}); // userId -> 'sending' | 'sent' | 'error'

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/friends/recommendations?limit=6', { headers: authHeaders() });
        const data = await res.json();
        if (active && data.success) setUsers(data.users);
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const sendRequest = async (e, userId) => {
    e.stopPropagation();
    setRequested((prev) => ({ ...prev, [userId]: 'sending' }));
    try {
      const res = await fetch(`/api/friends/request/${userId}`, { method: 'POST', headers: authHeaders() });
      const data = await res.json();
      setRequested((prev) => ({ ...prev, [userId]: res.ok ? 'sent' : 'error' }));
      // If they had already requested you, the backend makes you friends straight away
      if (res.ok && data.relationshipStatus === 'friends' && onFriendshipChange) onFriendshipChange();
    } catch {
      setRequested((prev) => ({ ...prev, [userId]: 'error' }));
    }
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 className="font-bold text-slate-200 text-sm mb-3">People you may know</h3>

      {loading ? (
        <p className="text-xs text-slate-500">Loading suggestions...</p>
      ) : users.length === 0 ? (
        <p className="text-xs text-slate-500">No suggestions right now.</p>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => {
            const state = requested[user._id];
            return (
              <li
                key={user._id}
                onClick={() => navigate(`/profile/${user._id}`)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <AvatarDisplay username={user.name || user.username} src={user.profileImage} className="w-9 h-9 shrink-0 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-indigo-300">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {user.mutualFriends > 0
                      ? `${user.mutualFriends} mutual friend${user.mutualFriends > 1 ? 's' : ''}`
                      : `@${user.username}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => sendRequest(e, user._id)}
                  disabled={state === 'sending' || state === 'sent'}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    state === 'sent'
                      ? 'bg-slate-800 text-slate-400'
                      : state === 'error'
                      ? 'bg-rose-600/20 text-rose-300'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {state === 'sent' ? 'Requested' : state === 'sending' ? '...' : state === 'error' ? 'Retry' : '+ Add'}
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
