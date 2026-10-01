import React, { useState, useRef, useEffect } from 'react';
import PostImage from './PostImage';
import PostComments from './PostComments';
import EditPostModal from './EditPost';
import ReportPostModal from './ReportPost';

function PostCard({ 
  post, 
  currentUser = { id: 1, name: "Shaun Marx" },
  users = [],
  comments = [],
  reportReasons = ['Inappropriate Content', 'Spam', 'Harassment', 'Violence', 'Other'],
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
  const [revealReportedPost, setRevealReportedPost] = useState(false);
  const dropdownRef = useRef(null);

  const postAuthor = users.find(u => u.id === post.userId) || { name: 'Unknown User' };
  const isOwner = post.userId === currentUser.id;
  const postText = post.caption || post.content || '';
  const postImg = post.image || post.imageFile || null;
  const reportCount = post.reports || (post.reportList ? post.reportList.length : 0);

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

  if (reportCount > 2 && !revealReportedPost) {
    return (
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-xl">Report</span>
          <div>
            <h6 className="text-sm font-semibold text-amber-200">Content Hidden</h6>
            <p className="text-xs text-slate-400">
              This post has been reported multiple times by community members and hidden.
            </p>
          </div>
        </div>
        <button
          onClick={() => setRevealReportedPost(true)}
          className="text-xs px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-medium transition-all"
        >
          View Post
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-transform hover:border-slate-700/80">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-bold text-xs">
            {postAuthor.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h6 className="text-xs font-bold text-slate-100">{postAuthor.name}</h6>
            <span className="text-[10px] text-slate-400">
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}
            </span>
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button 
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ⋮
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-36 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-20">
              {isOwner ? (
                <>
                  <button 
                    onClick={() => { setShowEditModal(true); setShowDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    Edit Post
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    Delete Post
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { setShowReportModal(true); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-xs text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
                >
                  Report Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {post.title && <h5 className="font-bold text-slate-100 text-sm">{post.title}</h5>}
        <p className="text-xs text-slate-300 leading-relaxed">{postText}</p>

        {renderHashtags()}

        {postImg && (
          <PostImage 
            src={postImg} 
            alt={postText || "Post image"} 
            onClick={() => onPostClick && onPostClick(post.id)} 
          />
        )}

        {/* Comments Section */}
        <div className="pt-2 border-t border-slate-800/60">
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
      </div>

      {/* Modals */}
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