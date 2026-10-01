import React from 'react';

// Grid of posts with click-to-select. `selected` is an array of post ids.
function PostPicker({ posts, selected, onChange, emptyText = 'No posts to choose from.' }) {
  if (posts.length === 0) return <p className="text-xs text-slate-500 py-4 text-center">{emptyText}</p>;

  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {posts.map((post) => {
        const isSelected = selected.includes(post._id);
        return (
          <button
            key={post._id}
            type="button"
            onClick={() => toggle(post._id)}
            aria-pressed={isSelected}
            title={post.caption}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
              isSelected ? 'border-indigo-500' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <img src={post.image} alt={post.caption} loading="lazy" className="w-full h-full object-cover" />
            {isSelected && (
              <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default PostPicker;
