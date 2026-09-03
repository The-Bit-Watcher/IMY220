import React, { useState, useRef, useEffect } from 'react';
import PostImage from './PostImage';
import PostComments from './PostComments';
import EditPostModal from './EditPostModal';
import ReportPostModal from './ReportPostModal';

function PostCard({ 
  post, 
  currentUser = { id: 1, name: "Shaun Marx" },
  users = [],
  comments = [],
  reportReasons = [],
  onHashtagClick,
  onPostClick,
  onUpdatePost,
  onDeletePost,
  onAddComment,
  onReportPost
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const postAuthor = users.find(u => u.id === post.userId) || { name: 'Unknown User' };
  const isOwner = post.userId === currentUser.id;
  const postText = post.caption || post.content || '';
  const postImg = post.image || post.imageFile || null;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderHashtags = () => {
    let tags = [];
    if (Array.isArray(post.hashtags)) {
      tags = post.hashtags;
    } else if (postText) {
      tags = postText.match(/#\w+/g) || [];
    }

    return tags.map((tag, idx) => (
      <span 
        key={idx} 
        onClick={() => onHashtagClick && onHashtagClick(tag)}
      >
        {tag.startsWith('#') ? tag : `#${tag}`}
      </span>
    ));
  };

  const handleDelete = () => {
    setShowDropdown(false);
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      if (onDeletePost) {
        onDeletePost(post.id);
      }
    }
  };

  return (
    <div>
      <div>
        <div>
          <h6>{postAuthor.name}</h6>
          <span className="text-xs text-gray-500">
            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}
          </span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button 
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            &#8285;
          </button>
          
          {showDropdown && (
            <div>
              {isOwner ? (
                <>
                  <button 
                    onClick={() => { setShowEditModal(true); setShowDropdown(false); }}
                  >
                    Edit Post
                  </button>
                  <button 
                    onClick={handleDelete}
                  >
                    Delete Post
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { setShowReportModal(true); setShowDropdown(false); }}
                >
                  Report Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 pt-0">
        {post.title && <h5>{post.title}</h5>}
        <p className="text-sm text-gray-700 mb-2">{postText}</p>

        <div className="mb-3">{renderHashtags()}</div>

        {postImg && (
          <PostImage 
            src={postImg} 
            alt={postText || "Post image"} 
            onClick={() => onPostClick && onPostClick(post.id)} 
          />
        )}

        <PostComments
          postId={post.id}
          comments={comments}
          currentUserId={currentUser.id}
          onAddComment={onAddComment}
          users={users}
          limit={2}
          onViewAllClick={() => onPostClick && onPostClick(post.id)}
        />
      </div>

      {isOwner && (
        <EditPostModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          post={post}
          onSave={onUpdatePost}
        />
      )}

      {!isOwner && (
        <ReportPostModal
          show={showReportModal}
          onHide={() => setShowReportModal(false)}
          postId={post.id}
          reasons={reportReasons}
          onSubmitReport={onReportPost}
        />
      )}
    </div>
  );
}

export default PostCard;