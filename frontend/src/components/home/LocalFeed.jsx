import React from 'react';
import { useNavigate } from 'react-router-dom';
import PostPreview from '../common/PostPreview/PostPreview';
import { posts } from '../../data/mockPosts';
import { users } from '../../data/mockProfiles';

function LocalFeed({ currentUserId = 1, searchTerm = '' }) {
  const navigate = useNavigate();

  const currentUser = users.find(u => u.id === currentUserId) || users[0];
  const friendIds = currentUser.friendIds || [];
  const favoriteIds = currentUser.favoriteIds || [];

  let localPosts = posts.filter(post => 
    friendIds.includes(post.userId) || favoriteIds.includes(post.userId)
  );

  if (searchTerm) {
    localPosts = localPosts.filter(post => 
      (post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (post.caption && post.caption.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  localPosts.sort((a, b) => {
    const isAFav = favoriteIds.includes(a.userId);
    const isBFav = favoriteIds.includes(b.userId);
    if (isAFav && !isBFav) return -1;
    if (!isAFav && isBFav) return 1;
    return b.id - a.id;
  });

  if (localPosts.length === 0) {
    return (
      <div>
        <h5>No local posts yet</h5>
        <p>Add friends or favorites to customize your personal feed!</p>
      </div>
    );
  }

  return (
    <div>
      {localPosts.map(post => {
        const author = users.find(u => u.id === post.userId);
        const isFav = favoriteIds.includes(post.userId);

        return (
          <div
            key={post.id}
            onClick={() => navigate(`/post/${post.id}`)}
          >
            {isFav && (
              <span>
                Favorite
              </span>
            )}
            <PostPreview
              title={post.title || post.caption || 'Untitled Post'}
              username={author ? author.name : 'Friend'}
              date={post.dates || post.createdAt ? new Date(post.createdAt || post.dates).toLocaleDateString() : 'Recently'}
              likes={post.likes || 0}
              img={post.image || post.imageFile || post.img || 'https://via.placeholder.com/300x200'}
            />
          </div>
        );
      })}
    </div>
  );
}

export default LocalFeed;