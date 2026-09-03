import React, { useState } from 'react';

export function FriendActionButton({ currentUserId, targetUserId, initialIsFriend, initialIsFavorite }) {
  const [status, setStatus] = useState(initialIsFriend ? 'friends' : 'none');
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

  if (currentUserId === targetUserId) {
    return (
      <span>
        Your Profile
      </span>
    );
  }

  return (
    <div>
      {status === 'none' && (
        <button 
          onClick={() => setStatus('pending_sent')}
        >
          + Send Friend Request
        </button>
      )}

      {status === 'pending_sent' && (
        <span>
          Request Pending
        </span>
      )}

      {status === 'friends' && (
        <>
          <span>
            Friends
          </span>
          <button 
            onClick={() => setIsFavorite(!isFavorite)}
          >
            {isFavorite ? 'Favourite' : 'Add to Favourites'}
          </button>
          <button 
            onClick={() => setStatus('none')}
          >
            Unfriend
          </button>
        </>
      )}
    </div>
  );
}