import React, { useState } from 'react';

function PostComments({ 
  postId, 
  comments = [], 
  users = [], 
  currentUserId = 1, 
  onAddComment, 
  limit = null, 
  onViewAllClick 
}){
  const [commentText, setCommentText] = useState('');

  const postComments = comments.filter(c => c.postId === postId);
  const displayedComments = limit ? postComments.slice(0, limit) : postComments;
  const hasMore = limit && postComments.length > limit;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now(),
      postId,
      userId: currentUserId,
      text: commentText.trim(),
      createdAt: new Date().toISOString()
    };

    if (onAddComment) {
      onAddComment(newComment);
    }
    setCommentText('');
  };

  return (
    <div className="mt-3">
      <div className="space-y-1 mb-2">
        {displayedComments.length === 0 ? (
          <div>No comments yet.</div>
        ) : (
          displayedComments.map(comment => {
            const author = users.find(u => u.id === comment.userId);
            const authorName = author ? author.name : `User ${comment.userId}`;

            return (
              <div key={comment.id} className="text-xs text-gray-800 py-0.5">
                <span>{authorName}:</span>
                <span>{comment.text}</span>
              </div>
            );
          })
        )}
      </div>

      {hasMore && onViewAllClick && (
        <button 
          type="button" 
          onClick={onViewAllClick}
        >
          View all {postComments.length} comments...
        </button>
      )}

      <form onSubmit={handleSubmit} className="flex gap-1">
        <input
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button 
          type="submit" 
          disabled={!commentText.trim()}
        >
          Post
        </button>
      </form>
    </div>
  );
}

export default PostComments;