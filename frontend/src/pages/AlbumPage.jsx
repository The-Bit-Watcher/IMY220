import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/common/Header/Header';
import ErrorBox from '../components/common/ErrorBox';
import HashtagLink from '../components/common/HashtagLink';
import VerifiedBadge from '../components/common/VerifiedBadge';
import EditAlbumModal from '../components/album/EditAlbumModal';
import AddPostsModal from '../components/album/AddPostsModal';
import { AvatarDisplay } from '../utils/avatarGenerator';
import { api } from '../services/api';
import { useConfirm } from '../context/ConfirmContext';

function AlbumPage({ id }) {
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [album, setAlbum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isOwner, setIsOwner] = useState(false);     // may add / remove photos
  const [canManage, setCanManage] = useState(false); // owner or admin: may edit / delete the album
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [modal, setModal] = useState(null); // null | 'edit' | 'add'
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api(`/api/get/album/${id}`).then((data) => {
    setAlbum(data.album);
    setPosts(data.posts);
    setIsOwner(data.isOwner);
    setCanManage(data.canManage);
  }), [id]);

  useEffect(() => {
    let active = true;
    load()
      .catch((err) => active && setLoadError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [load]);

  const removePost = async (postId) => {
    if (!(await confirm({ title: 'Remove photo?', message: 'Remove this photo from the album? The post itself is kept.', confirmLabel: 'Remove' }))) return;
    setBusy(true);
    setActionError('');
    try {
      await api(`/api/remove/album/${album._id}`, { method: 'POST', body: { postId, albumId: album._id } });
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteAlbum = async () => {
    const message = `Delete the album "${album.title}"? The ${posts.length} photo(s) in it will NOT be deleted.`;
    if (!(await confirm({ title: 'Delete album?', message, confirmLabel: 'Delete album', danger: true }))) return;
    setBusy(true);
    try {
      await api(`/api/delete/album/${album._id}`, { method: 'DELETE' });
      navigate(isOwner ? '/profile' : '/home', { replace: true });
    } catch (err) {
      setActionError(err.message);
      setBusy(false);
    }
  };

  if (loading || loadError || !album) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header />
        <main className="text-center p-10 space-y-3">
          <p className="text-sm text-slate-400">{loading ? 'Loading album...' : loadError || 'Album not found.'}</p>
          {!loading && <Link to="/home" className="btn btn-primary">Back to feed</Link>}
        </main>
      </div>
    );
  }

  const owner = album.userId && typeof album.userId === 'object' ? album.userId : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <button type="button" onClick={() => navigate(-1)} className="text-xs text-slate-400 hover:text-slate-50">← Back</button>
        <ErrorBox message={actionError} />

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-widest text-indigo-400 font-semibold">Album</p>
              <h1 className="text-2xl font-bold text-slate-100 m-0 break-words">{album.title}</h1>
              {owner && (
                <Link to={`/profile/${owner._id}`} className="mt-2 inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-50">
                  <AvatarDisplay username={owner.name || owner.username} src={owner.profileImage} className="w-6 h-6 text-[10px]" />
                  by {owner.name || owner.username}
                  <VerifiedBadge user={owner} />
                </Link>
              )}
            </div>

            {canManage && (
              <div className="flex flex-wrap gap-2 shrink-0">
                {isOwner && <button type="button" onClick={() => setModal('add')} disabled={busy} className="btn btn-primary">+ Add photos</button>}
                <button type="button" onClick={() => setModal('edit')} disabled={busy} className="btn btn-secondary">{isOwner ? 'Edit' : 'Edit (admin)'}</button>
                <button type="button" onClick={deleteAlbum} disabled={busy} className="btn btn-ghost-danger">{isOwner ? 'Delete' : 'Delete (admin)'}</button>
              </div>
            )}
          </div>

          {album.description && <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{album.description}</p>}

          {album.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              {album.hashtags.map((tag) => <HashtagLink key={tag} tag={tag} />)}
            </div>
          )}

          <p className="text-xs text-slate-500">{posts.length} photo{posts.length === 1 ? '' : 's'}</p>
        </section>

        {posts.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-500 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl">
            This album is empty.
            {isOwner && (
              <button type="button" onClick={() => setModal('add')} className="block mx-auto mt-3 text-link text-xs">Add photos</button>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {posts.map((post) => (
              <li key={post._id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900">
                <Link to={`/post/${post._id}`} className="block w-full h-full">
                  <img src={post.image} alt={post.caption} loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <span className="text-xs font-semibold text-white truncate">{post.caption}</span>
                    <span className="text-[10px] text-slate-300">♥ {post.likes || 0} · @{post.userId?.username || 'unknown'}</span>
                  </span>
                </Link>
                {isOwner && (
                  <button type="button" onClick={() => removePost(post._id)} disabled={busy} aria-label="Remove from album"
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/70 hover:bg-rose-600 text-white text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      {modal === 'edit' && (
        <EditAlbumModal album={album} onHide={() => setModal(null)}
          onSaved={(updated) => setAlbum((prev) => ({ ...prev, title: updated.title, description: updated.description, hashtags: updated.hashtags }))} />
      )}
      {modal === 'add' && (
        <AddPostsModal album={album} existingPostIds={posts.map((p) => p._id)} onHide={() => setModal(null)}
          onAdded={() => load().catch((err) => setActionError(err.message))} />
      )}
    </div>
  );
}

// Keyed by the URL id so every post/album starts with fresh state
function AlbumPageRoute() {
  const { id } = useParams();
  return <AlbumPage key={id} id={id} />;
}

export default AlbumPageRoute;
