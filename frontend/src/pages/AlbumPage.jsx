import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/common/Header/Header';
import EditAlbumModal from '../components/album/EditAlbumModal';
import AddPostsModal from '../components/album/AddPostsModal';
import { AvatarDisplay } from '../utils/avatarGenerator';
import { authHeaders } from '../utils/session';

function AlbumPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [album, setAlbum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'edit' | 'add'
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/get/album/${id}`, { headers: authHeaders() });
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      navigate('/');
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || 'Could not load album.');
    setAlbum(data.album);
    setPosts(data.posts);
    setIsOwner(data.isOwner);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    load()
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const removePost = async (e, postId) => {
    e.stopPropagation(); // don't open the post
    if (!window.confirm('Remove this photo from the album? The post itself is kept.')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/remove/album/${album._id}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ postId, albumId: album._id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      alert(err.message || 'Could not remove photo.');
    } finally {
      setBusy(false);
    }
  };

  const deleteAlbum = async () => {
    if (!window.confirm(`Delete the album "${album.title}"?\n\nThe ${posts.length} photo(s) in it will NOT be deleted.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/delete/album/${album._id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message);
      navigate('/profile');
    } catch (err) {
      alert(err.message || 'Could not delete album.');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header />
        <p className="text-center p-10 text-sm text-slate-500">Loading album...</p>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header />
        <div className="text-center p-10 space-y-3">
          <p className="text-sm text-slate-400">{error || 'Album not found.'}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-1.5 bg-indigo-600 rounded-lg text-xs">Go back</button>
        </div>
      </div>
    );
  }

  const owner = album.userId && typeof album.userId === 'object' ? album.userId : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 text-left">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <button onClick={() => navigate(-1)} className="text-xs text-slate-400 hover:text-white">← Back</button>

        {/* Album header */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-widest text-indigo-400 font-semibold">Album</p>
              <h1 className="text-2xl font-bold text-slate-100 m-0 tracking-normal break-words">{album.title}</h1>
              {owner && (
                <button type="button" onClick={() => navigate(`/profile/${owner._id}`)}
                  className="mt-2 flex items-center gap-2 text-xs text-slate-400 hover:text-white">
                  <AvatarDisplay username={owner.name || owner.username} src={owner.profileImage} className="w-6 h-6 text-[10px]" />
                  by {owner.name || owner.username}
                </button>
              )}
            </div>

            {isOwner && (
              <div className="flex flex-wrap gap-2 shrink-0">
                <button onClick={() => setModal('add')} disabled={busy}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold">+ Add photos</button>
                <button onClick={() => setModal('edit')} disabled={busy}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold">Edit</button>
                <button onClick={deleteAlbum} disabled={busy}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-semibold">Delete</button>
              </div>
            )}
          </div>

          {album.description && <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{album.description}</p>}

          {album.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {album.hashtags.map((tag) => (
                <button key={tag} type="button" onClick={() => navigate(`/home?tag=${encodeURIComponent(tag)}`)}
                  className="text-xs text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded">
                  #{tag}
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-500">{posts.length} photo{posts.length === 1 ? '' : 's'}</p>
        </section>

        {/* Photos */}
        {posts.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-500 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl">
            This album is empty.
            {isOwner && (
              <button onClick={() => setModal('add')} className="block mx-auto mt-3 text-indigo-400 hover:underline text-xs">Add photos</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {posts.map((post) => (
              <div key={post._id} role="link" tabIndex={0}
                onClick={() => navigate(`/post/${post._id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/post/${post._id}`)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <img src={post.image} alt={post.caption} loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {/* Hover overlay with details */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <p className="text-xs font-semibold text-white truncate">{post.caption}</p>
                  <p className="text-[10px] text-slate-300">♥ {post.likes || 0} · @{post.userId?.username || 'unknown'}</p>
                </div>
                {isOwner && (
                  <button type="button" onClick={(e) => removePost(e, post._id)} disabled={busy}
                    title="Remove from album"
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/70 hover:bg-rose-600 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {modal === 'edit' && (
        <EditAlbumModal album={album} onHide={() => setModal(null)}
          onSaved={(updated) => setAlbum((prev) => ({ ...prev, title: updated.title, description: updated.description, hashtags: updated.hashtags }))} />
      )}
      {modal === 'add' && (
        <AddPostsModal album={album} existingPostIds={posts.map((p) => p._id)} onHide={() => setModal(null)}
          onAdded={() => load().catch((err) => setError(err.message))} />
      )}
    </div>
  );
}

export default AlbumPage;
