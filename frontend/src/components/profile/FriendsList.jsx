import { Link } from 'react-router-dom';
import { AvatarDisplay } from '../../utils/avatarGenerator';
import VerifiedBadge from '../common/VerifiedBadge';

function FriendsList({ friends = [], favouriteIds = [] }) {
  if (friends.length === 0) {
    return <p className="text-slate-500 text-center py-6 text-sm">No friends added yet.</p>;
  }

  const favSet = new Set(favouriteIds.map(String));

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {friends.map((friend) => (
        <li key={friend._id}>
          <Link to={`/profile/${friend._id}`}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center gap-3 transition-colors">
            <AvatarDisplay username={friend.name || friend.username} src={friend.profileImage} className="w-10 h-10 shrink-0 text-xs" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 font-semibold text-slate-200 text-xs"><span className="truncate">{friend.name}</span><VerifiedBadge user={friend} /></span>
              <span className="block text-slate-400 text-xs truncate">@{friend.username}</span>
              {friend.location && <span className="block text-slate-500 text-[10px] truncate">{friend.location}</span>}
            </span>
            {favSet.has(String(friend._id)) && <span className="text-amber-400 text-xs" title="Favourite" aria-label="Favourite">★</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default FriendsList;
