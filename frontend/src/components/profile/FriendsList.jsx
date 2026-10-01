import React, { useEffect, useState } from 'react';
import { users } from '../../data/mockProfiles';

function UserFriends({ currentUserId, targetUserId }) {
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const targetUser = users.find(u => u.id === targetUserId);
  const currentUser = users.find(u => u.id === currentUserId);

  const isOwnProfile = currentUserId === targetUserId;
  const isFriends = currentUser?.friendIds?.includes(targetUserId);
  const canViewFriends = isOwnProfile || isFriends;

  useEffect(() => {
    let isMounted = true;

    const fetchFriends = async () => {
      if (!canViewFriends || !targetUser) {
        setIsLoading(false);
        return;
      }

      await Promise.resolve();

      if (isMounted) {
        // Get all user objects that match targetUser's friendIds
        const friendList = users.filter(u => targetUser.friendIds?.includes(u.id));
        setFriends(friendList);
        setIsLoading(false);
      }
    };

    fetchFriends();

    return () => {
      isMounted = false;
    };
  }, [targetUserId, targetUser, canViewFriends]);

  if (!canViewFriends) {
    return (
      <div>
        You must be friends with this user to view their friends list.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div >
      <div>
        <h5>Friends</h5>
        <span>
          {friends.length}
        </span>
      </div>

      <div className="p-4">
        {friends.length === 0 ? (
          <p>No friends to show.</p>
        ) : (
          <div>
            {friends.map(friend => (
              <div key={friend.id}>
                <img 
                  src={friend.profileImage || 'https://via.placeholder.com/40'} 
                  alt={friend.name} 
                />
                <div>
                  <div>
                    {friend.name}
                  </div>
                  <div>
                    @{friend.username}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserFriends;