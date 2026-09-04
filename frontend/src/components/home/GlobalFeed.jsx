import React from 'react';
import { useNavigate } from 'react-router-dom';
import PostPreview from '../common/PostPreview/PostPreview';
import { posts } from '../../data/mockPosts';
import { users } from '../../data/mockProfiles';

function GlobalFeed({ searchTerm = '' }) {
  const navigate = useNavigate();

  const globalPosts = posts.filter(post => {
    if (!searchTerm) return true;
    return (
      (post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (post.caption && post.caption.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  if (globalPosts.length === 0) {
    return (
      <div>
        <h5>No global posts found</h5>
        <p>Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div>
      {globalPosts.map(post => {
        const author = users.find(u => u.id === post.userId);

        return (
          <div
            key={post.id}
            onClick={() => navigate(`/post/${post.id}`)}
          >
            <PostPreview
              title={post.title || post.caption || 'Untitled Post'}
              username={author ? author.name : (post.username || 'Community Member')}
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

export default GlobalFeed;