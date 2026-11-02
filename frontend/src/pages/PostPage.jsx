import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

import Header from '../components/common/Header/Header';
import ErrorBox from '../components/common/ErrorBox';
import HashtagLink from '../components/common/HashtagLink';
import VerifiedBadge from '../components/common/VerifiedBadge';
import PostImage from '../components/post/PostImage';
import PostComments from '../components/post/PostComments';
import EditPostModal from '../components/post/EditPost';
import ReportPostModal from '../components/post/ReportPost';
import AddToAlbumModal from '../components/post/AddToAlbumModal';
import { AvatarDisplay } from '../utils/avatarGenerator';
import { getStoredUser } from '../utils/session';
import { api } from '../services/api';
import { useConfirm } from '../context/ConfirmContext';

function PostPage({ id }) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { userId: currentUserId, role } = getStoredUser();
  const isAdmin = role === 'admin';

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [myAlbumIds, setMyAlbumIds] = useState([]);
  const [reportedByMe, setReportedByMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [liking, setLiking] = useState(false);
  const [modal, setModal] = useState(null); // null | 'edit' | 'report' | 'album'
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    let active = true;
    api(`/api/get/post/${id}`)
      .then((data) => {
        if (!active) return;
        setPost(data.post);
        setComments(data.comments || []);
        setMyAlbumIds(data.myAlbumIds || []);
        setReportedByMe(!!data.reportedByMe);
      })
      .catch((err) => active && setLoadError(err.status === 404 ? 'Post not found' : err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  // Close the "..." menu when clicking elsewhere
  useEffect(() => {
    if (!showMenu) return undefined;
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setShowMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showMenu]);

  const author = post?.userId && typeof post.userId === 'object' ? post.userId : null;
  const isOwner = !!post && String(author?._id || post.userId) === String(currentUserId);
  const canManage = isOwner || isAdmin;
  const mine = (c) => String(c.userId?._id || c.userId) === String(currentUserId);

  // ---- Actions --------------------------------------------------------------
  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);
    const prev = { likedByMe: post.likedByMe, likes: post.likes };
    setPost((p) => ({ ...p, likedByMe: !p.likedByMe, likes: Math.max(0, (p.likes || 0) + (p.likedByMe ? -1 : 1)) }));
    try {
      const data = await api(`/api/posts/${id}/like`, { method: 'POST' });
      setPost((p) => ({ ...p, likedByMe: data.liked, likes: data.likes }));
    } catch (err) {
      setPost((p) => ({ ...p, ...prev }));
      setActionError(err.message);
    } finally {
      setLiking(false);
    }
  };

  const addComment = async (text) => {
    try {
      const data = await api(`/api/posts/${id}/comments`, { method: 'POST', body: { text } });
      setComments((prev) => [data.comment, ...prev]);
      setActionError('');
      return true;
    } catch (err) {
      setActionError(err.message);
      return false;
    }
  };

  const editComment = async (commentId, text) => {
    try {
      const data = await api(`/api/comments/${commentId}`, { method: 'PUT', body: { text } });
      setComments((prev) => prev.map((c) => (c._id === commentId ? data.comment : c)));
      return true;
    } catch (err) {
      setActionError(err.message);
      return false;
    }
  };

  const deleteComment = async (commentId) => {
    if (!(await confirm({ title: 'Delete comment?', message: 'This comment will be removed permanently.', confirmLabel: 'Delete', danger: true }))) return;
    try {
      await api(`/api/comments/${commentId}`, { method: 'DELETE' });
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      setActionError(err.message);
    }
  };

  const saveEdit = async ({ caption, hashtags }) => {
    try {
      const data = await api(`/api/update/post/${id}`, { method: 'PUT', body: { caption, hashtags } });
      // The response isn't populated, so keep the author object we already have
      setPost((p) => ({ ...p, caption: data.post.caption, hashtags: data.post.hashtags }));
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  };

  const deletePost = async () => {
    setShowMenu(false);
    const message = isOwner
      ? 'This deletes the post, its comments and removes it from every album. This cannot be undone.'
      : `You are deleting @${author?.username}'s post as an admin. This cannot be undone.`;
    if (!(await confirm({ title: 'Delete post?', message, confirmLabel: 'Delete post', danger: true }))) return;
    try {
      await api(`/api/delete/post/${id}`, { method: 'DELETE' });
      navigate(isOwner ? '/profile' : '/home', { replace: true });
    } catch (err) {
      setActionError(err.message);
    }
  };

  const submitReport = async ({ reason, additionalDetails }) => {
    try {
      await api(`/api/posts/${id}/report`, { method: 'POST', body: { reason, additionalDetails } });
      setReportedByMe(true);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  };

  // ---- Render ---------------------------------------------------------------
  if (loading || loadError || !post) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header />
        <main className="flex items-center justify-center p-4 mt-10">
          {loading ? (
            <p className="text-sm text-slate-400">Loading post...</p>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center space-y-4">
              <h1 className="text-lg font-bold text-slate-100 m-0">{loadError || 'Post not found'}</h1>
              <p className="text-xs text-slate-400">This post doesn't exist or was removed.</p>
              <Link to="/home" className="btn btn-primary">Back to feed</Link>
            </div>
          )}
        </main>
      </div>
    );
  }

  const authorName = author?.name || author?.username || 'Unknown user';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <button type="button" onClick={() => navigate(-1)} className="text-xs text-slate-400 hover:text-slate-50">← Back</button>

        {post.hidden && (
          <ErrorBox message="This post has been reported several times and is hidden from the feeds until an admin reviews it." />
        )}
        <ErrorBox message={actionError} />

        <article className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-3 bg-slate-950 flex items-center justify-center">
            <PostImage src={post.image} alt={post.caption} className="w-full rounded-none" />
          </div>

          <div className="lg:col-span-2 flex flex-col min-h-0 lg:max-h-[80vh]">
            {/* Author + menu */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              {author ? (
                <Link to={`/profile/${author._id}`} className="flex items-center gap-3 group">
                  <AvatarDisplay username={authorName} src={author.profileImage} className="w-10 h-10 text-sm shrink-0" />
                  <span>
                    <span className="flex items-center gap-1 text-sm font-bold text-slate-100 group-hover:text-indigo-400">{authorName}<VerifiedBadge user={author} /></span>
                    <span className="block text-[11px] text-slate-500">
                      @{author.username} · <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleString()}</time>
                    </span>
                  </span>
                </Link>
              ) : <span className="text-sm text-slate-400">Unknown user</span>}

              {(canManage || !isOwner) && (
                <div className="relative" ref={menuRef}>
                  <button type="button" onClick={() => setShowMenu((s) => !s)} aria-label="Post options" aria-expanded={showMenu}
                    className="p-1.5 px-2.5 rounded-lg text-slate-400 hover:text-slate-50 hover:bg-slate-800">⋮</button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-20">
                      {canManage && (
                        <>
                          <button type="button" onClick={() => { setModal('edit'); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800">
                            {isOwner ? 'Edit post' : 'Edit post (admin)'}
                          </button>
                          <button type="button" onClick={deletePost}
                            className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10">
                            {isOwner ? 'Delete post' : 'Delete post (admin)'}
                          </button>
                        </>
                      )}
                      {!isOwner && (
                        <button type="button" disabled={reportedByMe} onClick={() => { setModal('report'); setShowMenu(false); }}
                          className="w-full text-left px-4 py-2 text-xs text-amber-400 hover:bg-amber-500/10 disabled:text-slate-500 disabled:hover:bg-transparent">
                          {reportedByMe ? 'Already reported' : 'Report post'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Caption + tags */}
            <div className="p-4 space-y-3 border-b border-slate-800">
              <h1 className="text-sm font-normal font-body text-slate-200 leading-relaxed whitespace-pre-line m-0">{post.caption}</h1>
              {post.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {post.hashtags.map((tag) => <HashtagLink key={tag} tag={tag} />)}
                </div>
              )}
              {isAdmin && post.reportCount > 0 && (
                <p className="text-[11px] text-amber-300">Admin: {post.reportCount} report{post.reportCount === 1 ? '' : 's'} on this post. See the <Link to="/admin" className="underline">admin dashboard</Link>.</p>
              )}
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-2 p-3 border-b border-slate-800 text-xs">
              <button type="button" onClick={toggleLike} disabled={liking} aria-pressed={!!post.likedByMe}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  post.likedByMe ? 'bg-rose-500/15 text-rose-400' : 'text-slate-300 hover:bg-slate-800'
                }`}>
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill={post.likedByMe ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                {post.likes || 0} {post.likes === 1 ? 'like' : 'likes'}
              </button>

              <span className="px-3 py-1.5 text-slate-300">💬 {comments.length}</span>

              <button type="button" onClick={() => setModal('album')}
                className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold ${
                  myAlbumIds.length > 0 ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-300 hover:bg-slate-800'
                }`}>
                📁 {myAlbumIds.length > 0 ? `In ${myAlbumIds.length} album${myAlbumIds.length > 1 ? 's' : ''}` : 'Add to album'}
              </button>
            </div>

            {/* Comments */}
            <section className="p-4 flex-1 overflow-y-auto">
              <h2 className="text-sm font-bold text-slate-200 m-0">Comments ({comments.length})</h2>
              <PostComments
                comments={comments}
                onAddComment={addComment}
                onEditComment={editComment}
                onDeleteComment={deleteComment}
                canEdit={(c) => mine(c) || isAdmin}
                canDelete={(c) => mine(c) || isOwner || isAdmin}
              />
            </section>
          </div>
        </article>
      </main>

      {modal === 'edit' && canManage && (
        <EditPostModal post={post} asAdmin={!isOwner} onHide={() => setModal(null)} onSave={saveEdit} />
      )}
      {modal === 'report' && !isOwner && (
        <ReportPostModal onHide={() => setModal(null)} onSubmitReport={submitReport} />
      )}
      {modal === 'album' && (
        <AddToAlbumModal postId={post._id} onHide={() => setModal(null)} onChange={setMyAlbumIds} />
      )}
    </div>
  );
}

// Keyed by the URL id so every post/album starts with fresh state
function PostPageRoute() {
  const { id } = useParams();
  return <PostPage key={id} id={id} />;
}

export default PostPageRoute;
