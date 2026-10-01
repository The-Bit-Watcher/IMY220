import React, { useState } from 'react';

// Comments come from the backend with userId populated: { _id, text, createdAt, userId: { _id, username, name } }
function PostComments({
  comments = [],
  onAddComment,
  onDeleteComment,   
  canDelete = () => false,
  limit = null,
  onViewAllClick
}) {
  const [commentText, setCommentText] = useState('');

  const displayedComments = limit ? comments.slice(0, limit) : comments;
  const hasMore = limit && comments.length > limit;

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    // Parent only needs the text; the backend knows who you are from the JWT
    if (onAddComment) onAddComment(text);
    setCommentText('');
  };

  return (
    <div className="mt-3">
      <div className="space-y-2 mb-3">
        {displayedComments.length === 0 ? (
          <div className="text-xs text-slate-500">No comments yet.</div>
        ) : (
          displayedComments.map((comment) => {
            const author = comment.userId && typeof comment.userId === 'object' ? comment.userId : null;
            const authorName = author?.name || author?.username || 'Unknown user';

            return (
              <div key={comment._id} className="text-xs text-slate-300 py-0.5">
                <span className="font-semibold text-slate-100 mr-1">{authorName}:</span>
                <span>{comment.text}</span>
                {comment.createdAt && (
                  <span className="ml-2 text-[10px] text-slate-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                )}
                {onDeleteComment && canDelete(comment) && (
                  <button
                    type="button"
                    onClick={() => onDeleteComment(comment._id)}
                    className="ml-2 text-[10px] text-slate-500 hover:text-rose-400"
                  >
                    delete
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {hasMore && onViewAllClick && (
        <button type="button" onClick={onViewAllClick} className="text-xs text-indigo-400 hover:underline mb-2">
          View all {comments.length} comments...
        </button>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!commentText.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </div>
  );
}

export default PostComments;
