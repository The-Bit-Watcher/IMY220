import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import PostImage from '../components/post/PostImage';
import PostComments from '../components/post/PostComments';
import EditPostModal from '../components/post/EditPost';
import ReportPostModal from '../components/post/ReportPost';

function PostPage({ currentUserId = null, reportReasons = ['Inappropriate Content', 'Spam', 'Harassment', 'Violence', 'Other'] }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Component States
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Helper to fetch authorization header
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  // Fetch Post & Comments from Backend on Mount or ID Change
  useEffect(() => {
    const fetchPostData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/get/post/${id}`, {
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Post not found');
          }
          throw new Error('Failed to load post');
        }

        const data = await response.json();
        if (data.success) {
          setPost(data.post);
          setComments(data.comments || []);
        } else {
          throw new Error(data.message || 'Error fetching post details');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPostData();
  }, [id]);

  // Determine if the logged-in user owns this post
  const isOwner = post && (post.userId === currentUserId || post.userId?._id === currentUserId);

  // Helper to extract hashtags array or parse from caption
  const getHashtags = () => {
    if (!post) return [];
    if (Array.isArray(post.hashtags)) return post.hashtags;
    return post.caption ? post.caption.match(/#\w+/g) || [] : [];
  };

  // Handle Post Update (via Edit Modal)
  const handleSaveEdit = async (updatedPostData) => {
    try {
      const response = await fetch(`/api/update/post/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedPostData)
      });
      const data = await response.json();
      if (data.success) {
        setPost(data.post || { ...post, ...updatedPostData });
        setShowEditModal(false);
      } else {
        alert(data.message || 'Failed to update post.');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('An error occurred while updating the post.');
    }
  };

  // Handle Post Deletion
  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/delete/post/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        navigate('/home');
      } else {
        alert(data.message || 'Failed to delete post.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('An error occurred while deleting the post.');
    }
  };

  // Handle Comment Creation
  const handleAddComment = async (commentText) => {
    try {
      const response = await fetch(`/api/create/${id}/comment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({text: commentText })
      });

      const data = await response.json();
      if (data.success && data.comment) {
        setComments(prev => [data.comment, ...prev]);
      } else {
        // Fallback for UI optimistic update if backend returns simple status
        const newCommentObj = {
          _id: Date.now().toString(),
          postId: id,
          content: commentText,
          userId: currentUserId,
          createdAt: new Date().toISOString()
        };
        setComments(prev => [newCommentObj, ...prev]);
      }
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  // Handle Post Report Submission
  const handleReportSubmit = async (reportData) => {
    try {
      const response = await fetch(`/api/posts/${id}/report`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reason: reportData.reason,
          additionalDetails: reportData.additionalDetails
        })
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.message || 'Could not submit report.');
      }
    } catch (err) {
      console.error('Report error:', err);
    }
  };

  // Render Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading post...</span>
        </div>
      </div>
    );
  }

  // Render Error / Not Found State
  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center space-y-4 shadow-2xl">
          <div className="text-4xl">🔍</div>
          <h4 className="text-lg font-bold text-slate-100">{error || 'Post Not Found'}</h4>
          <p className="text-xs text-slate-400">
            The post you are looking for does not exist or has been removed by the author.
          </p>
          <button
            onClick={() => navigate('/home')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            Return to Feed
          </button>
        </div>
      </div>
    );
  }

  const authorName = post.username || post.userId?.name || post.userId?.username || 'Unknown User';
  const authorAvatar = post.userAvatar || post.userId?.profileImage || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => navigate('/home')} className="hover:text-white transition-colors">
            Home Feed
          </button>
          <span>/</span>
          <span className="text-slate-200 font-medium">Post #{post._id || post.id}</span>
        </nav>

        {/* Main Post Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
          
          {/* Post Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div 
              onClick={() => post.userId && navigate(`/profile/${post.userId._id || post.userId}`)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              {authorAvatar ? (
                <img 
                  src={authorAvatar} 
                  alt={authorName} 
                  className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-bold text-sm">
                  {authorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h6 className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                  {authorName}
                </h6>
                <p className="text-[10px] text-slate-400">
                  {post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Recently'}
                </p>
              </div>
            </div>

            {/* Dropdown Options */}
            <div className="relative">
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
                        className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
                      >
                        Edit Post
                      </button>
                      <button
                        onClick={() => { handleDeletePost(); setShowDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Delete Post
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setShowReportModal(true); setShowDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors"
                    >
                      Report Post
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Post Body */}
          <div className="space-y-4">
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {post.caption || post.content}
            </p>

            {/* Hashtags */}
            {getHashtags().length > 0 && (
              <div className="flex flex-wrap gap-2">
                {getHashtags().map((tag, idx) => (
                  <span 
                    key={idx} 
                    onClick={() => navigate(`/home?tag=${encodeURIComponent(tag.replace('#', ''))}`)}
                    className="text-xs font-semibold text-indigo-400 hover:underline cursor-pointer"
                  >
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            )}

            {/* Post Image */}
            {(post.image || post.imageFile || post.img) && (
              <div className="rounded-xl overflow-hidden border border-slate-800">
                <PostImage 
                  src={post.image || post.imageFile || post.img} 
                  alt={post.caption || "Post image"} 
                />
              </div>
            )}

            <hr className="border-slate-800 my-6" />

            {/* Post Comments Section */}
            <h6 className="text-sm font-bold text-slate-200">Comments</h6>
            <PostComments
              postId={post._id || post.id}
              comments={comments}
              currentUserId={currentUserId}
              onAddComment={handleAddComment}
              limit={null} // Display all comments on dedicated post page
            />
          </div>
        </div>
      </div>

      {/* Edit Post Modal */}
      {isOwner && (
        <EditPostModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          post={post}
          onSave={handleSaveEdit}
        />
      )}

      {/* Report Post Modal */}
      {!isOwner && (
        <ReportPostModal
          show={showReportModal}
          onHide={() => setShowReportModal(false)}
          postId={post._id || post.id}
          reasons={reportReasons}
          onSubmitReport={handleReportSubmit}
        />
      )}
    </div>
  );
}

export default PostPage;