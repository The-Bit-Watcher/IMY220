import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarDisplay } from '../../utils/avatarGenerator';

// friends === undefined means the backend hid the list (not friends with this user)
function FriendsList({ friends, ownerUsername, favouriteIds = [] }) {
  const navigate = useNavigate();

  if (!friends) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-sm">
        Friends list is hidden. You must be friends with @{ownerUsername} to view their connections.
      </div>
    );
  }

  if (friends.length === 0) {
    return <div className="text-slate-500 text-center py-6 text-sm">No friends added yet.</div>;
  }

  const favSet = new Set(favouriteIds.map(String));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {friends.map((friend) => (
        <button
          key={friend._id}
          type="button"
          onClick={() => navigate(`/profile/${friend._id}`)}
          className="text-left bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center gap-3 transition-colors"
        >
          <AvatarDisplay username={friend.name || friend.username} src={friend.profileImage} className="w-10 h-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <h5 className="font-semibold text-slate-200 text-xs truncate">{friend.name}</h5>
            <p className="text-slate-400 text-xs truncate">@{friend.username}</p>
            {friend.location && <p className="text-slate-500 text-[10px] truncate">{friend.location}</p>}
          </div>
          {favSet.has(String(friend._id)) && (
            <span className="text-amber-400 text-xs" title="Favourite">★</span>
          )}
        </button>
      ))}
    </div>
  );
}

export default FriendsList;
