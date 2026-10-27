import React from 'react';
import { useNavigate } from 'react-router-dom';

// Compact grid of a user's posts: square thumbnail + caption + author
function UserPostsList({ posts = [], emptyText = "No posts yet." }) {
  const navigate = useNavigate();

  if (posts.length === 0) {
    return <div className="text-slate-500 text-center py-6 text-sm">{emptyText}</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {posts.map((post) => {
        const author = post.userId && typeof post.userId === 'object' ? post.userId : null;
        return (
          <button
            key={post._id}
            type="button"
            onClick={() => navigate(`/post/${post._id}`)}
            className="group text-left bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/60 transition-colors"
          >
            <div className="aspect-square bg-slate-950 overflow-hidden">
              {post.image ? (
                <img
                  src={post.image}
                  alt={post.caption}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">No image</div>
              )}
            </div>
            <div className="p-2">
              <p className="text-xs font-semibold text-slate-200 truncate">{post.caption || 'Untitled'}</p>
              <div className="flex justify-between items-center mt-0.5 text-[10px] text-slate-500">
                <span className="truncate">@{author?.username || 'unknown'}</span>
                <span className="shrink-0">♥ {post.likes || 0}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default UserPostsList;
