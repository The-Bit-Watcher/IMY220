import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Header from '../components/common/Header/Header';
import PostImage from '../components/post/PostImage';
import PostComments from '../components/post/PostComments';
import EditPostModal from '../components/post/EditPost';
import ReportPostModal from '../components/post/ReportPost';
import AddToAlbumModal from '../components/post/AddToAlbumModal';
import { AvatarDisplay } from '../utils/avatarGenerator';
import { getStoredUser, authHeaders } from '../utils/session';

function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUserId = getStoredUser().userId;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [myAlbumIds, setMyAlbumIds] = useState([]);
  const [reportedByMe, setReportedByMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liking, setLiking] = useState(false);

  // Which modal is open: null | 'edit' | 'report' | 'album'
  const [modal, setModal] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const commentsRef = useRef(null);

  // ---- Load -----------------------------------------------------------------
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/get/post/${id}`, { headers: authHeaders() });
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          navigate('/');
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(res.status === 404 ? 'Post not found' : data.message || 'Failed to load post');

        if (!active) return;
        setPost(data.post);
        setComments(data.comments || []);
        setMyAlbumIds(data.myAlbumIds || []);
        setReportedByMe(!!data.reportedByMe);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, navigate]);

  // Close the "..." menu when clicking elsewhere
  useEffect(() => {
    if (!showMenu) return;
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setShowMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showMenu]);

  const author = post?.userId && typeof post.userId === 'object' ? post.userId : null;
  const isOwner = !!post && String(author?._id || post.userId) === String(currentUserId);

  // ---- Actions --------------------------------------------------------------
  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);
    // Optimistic update, rolled back on failure
    const prev = { likedByMe: post.likedByMe, likes: post.likes };
    setPost((p) => ({ ...p, likedByMe: !p.likedByMe, likes: Math.max(0, (p.likes || 0) + (p.likedByMe ? -1 : 1)) }));
    try {
      const res = await fetch(`/api/posts/${id}/like`, { method: 'POST', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setPost((p) => ({ ...p, likedByMe: data.liked, likes: data.likes }));
    } catch (err) {
      console.error('Like failed:', err);
      setPost((p) => ({ ...p, ...prev }));
    } finally {
      setLiking(false);
    }
  };

  const handleAddComment = async (text) => {
    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success && data.comment) setComments((prev) => [data.comment, ...prev]);
      else alert(data.message || 'Could not post comment.');
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (data.success) setComments((prev) => prev.filter((c) => c._id !== commentId));
      else alert(data.message || 'Could not delete comment.');
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  const handleSaveEdit = async ({ caption, hashtags }) => {
    try {
      const res = await fetch(`/api/update/post/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ caption, hashtags }),
      });
      const data = await res.json();
      // Merge only edited fields: the response isn't populated, so keep the author object we have
      if (data.success) setPost((p) => ({ ...p, caption: data.post.caption, hashtags: data.post.hashtags }));
      else alert(data.message || 'Failed to update post.');
    } catch (err) {
      console.error('Update error:', err);
      alert('An error occurred while updating the post.');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/delete/post/${id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (data.success) navigate('/profile');
      else alert(data.message || 'Failed to delete post.');
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleReportSubmit = async ({ reason, additionalDetails }) => {
    try {
      const res = await fetch(`/api/posts/${id}/report`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ reason, additionalDetails }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setReportedByMe(true);
        return { ok: true };
      }
      return { ok: false, message: data.message };
    } catch {
      return { ok: false, message: 'Network error. Please try again.' };
    }
  };

  // ---- Render ---------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header />
        <div className="flex items-center justify-center gap-3 p-10 text-slate-400 text-sm">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading post...</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header />
        <div className="flex items-center justify-center p-4 mt-10">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center space-y-4">
            <h4 className="text-lg font-bold text-slate-100">{error || 'Post not found'}</h4>
            <p className="text-xs text-slate-400">This post doesn't exist or was removed by its author.</p>
            <button onClick={() => navigate('/home')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">
              Return to Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hashtags = Array.isArray(post.hashtags) ? post.hashtags : [];
  const authorName = author?.name || author?.username || 'Unknown user';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans text-left">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="text-xs text-slate-400 hover:text-white mb-4">
          ← Back
        </button>

        {post.hidden && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl p-3">
            This post has been reported multiple times and is hidden from the feeds pending review.
          </div>
        )}

        <article className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-5">
          {/* Image */}
          <div className="lg:col-span-3 bg-slate-950 flex items-center justify-center">
            <PostImage src={post.image} alt={post.caption} className="w-full rounded-none" />
          </div>

          {/* Details */}
          <div className="lg:col-span-2 flex flex-col min-h-0 lg:max-h-[80vh]">
            {/* Author + menu */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <button
                type="button"
                onClick={() => author && navigate(`/profile/${author._id}`)}
                className="flex items-center gap-3 group text-left"
              >
                <AvatarDisplay username={authorName} src={author?.profileImage} className="w-10 h-10 text-sm shrink-0" />
                <span>
                  <span className="block text-sm font-bold text-slate-100 group-hover:text-indigo-400">{authorName}</span>
                  <span className="block text-[11px] text-slate-500">
                    @{author?.username || 'unknown'} · {post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Recently'}
                  </span>
                </span>
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setShowMenu((s) => !s)}
                  aria-label="Post options"
                  className="p-1.5 px-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ⋮
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-20">
                    {isOwner ? (
                      <>
                        <button onClick={() => { setModal('edit'); setShowMenu(false); }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800">Edit post</button>
                        <button onClick={() => { setShowMenu(false); handleDeletePost(); }}
                          className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10">Delete post</button>
                      </>
                    ) : (
                      <button
                        disabled={reportedByMe}
                        onClick={() => { setModal('report'); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-amber-400 hover:bg-amber-500/10 disabled:text-slate-500 disabled:hover:bg-transparent"
                      >
                        {reportedByMe ? 'Already reported' : 'Report post'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Caption + tags */}
            <div className="p-4 space-y-3 border-b border-slate-800">
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{post.caption}</p>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => navigate(`/home?tag=${encodeURIComponent(tag.replace(/^#/, ''))}`)}
                      className="text-xs font-semibold text-indigo-400 hover:underline"
                    >
                      #{tag.replace(/^#/, '')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-2 p-3 border-b border-slate-800 text-xs">
              <button
                type="button"
                onClick={toggleLike}
                disabled={liking}
                aria-pressed={!!post.likedByMe}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  post.likedByMe ? 'bg-rose-500/15 text-rose-400' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill={post.likedByMe ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                {post.likes || 0} {post.likes === 1 ? 'like' : 'likes'}
              </button>

              <button
                type="button"
                onClick={() => commentsRef.current?.querySelector('input')?.focus()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800"
              >
                💬 {comments.length}
              </button>

              <button
                type="button"
                onClick={() => setModal('album')}
                className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold ${
                  myAlbumIds.length > 0 ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                📁 {myAlbumIds.length > 0 ? `In ${myAlbumIds.length} album${myAlbumIds.length > 1 ? 's' : ''}` : 'Add to album'}
              </button>

              {!isOwner && (
                <button
                  type="button"
                  disabled={reportedByMe}
                  onClick={() => setModal('report')}
                  title={reportedByMe ? 'You already reported this post' : 'Report post'}
                  className="px-2 py-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 disabled:text-slate-600 disabled:hover:bg-transparent"
                >
                  ⚑
                </button>
              )}
            </div>

            {/* Comments */}
            <div ref={commentsRef} className="p-4 flex-1 overflow-y-auto">
              <h2 className="text-sm font-bold text-slate-200 m-0">Comments ({comments.length})</h2>
              <PostComments
                comments={comments}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                canDelete={(c) => isOwner || String(c.userId?._id || c.userId) === String(currentUserId)}
              />
            </div>
          </div>
        </article>
      </main>

      {modal === 'edit' && isOwner && (
        <EditPostModal show post={post} onHide={() => setModal(null)} onSave={handleSaveEdit} />
      )}
      {modal === 'report' && !isOwner && (
        <ReportPostModal onHide={() => setModal(null)} onSubmitReport={handleReportSubmit} />
      )}
      {modal === 'album' && (
        <AddToAlbumModal postId={post._id} onHide={() => setModal(null)} onChange={setMyAlbumIds} />
      )}
    </div>
  );
}

export default PostPage;
