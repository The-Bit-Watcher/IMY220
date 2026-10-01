import React, { useEffect, useState } from 'react';
import { authHeaders } from '../../utils/session';

// Lists the logged-in user's albums with a toggle per album, plus "create new album".
function AddToAlbumModal({ postId, onHide, onChange }) {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState({}); // albumId -> true while saving
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const containsPost = (album) => (album.postId || []).some((id) => String(id) === String(postId));

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/get/albums/me', { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Could not load albums.');
        if (active) setAlbums(data.albums);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onHide();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onHide]);

  const replaceAlbum = (updated) =>
    setAlbums((prev) => prev.map((a) => (a._id === updated._id ? { ...a, postId: updated.postId } : a)));

  // Tell the post page which of my albums contain this post (drives the "In N albums" label)
  useEffect(() => {
    if (!loading) onChange?.(albums.filter(containsPost).map((a) => a._id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albums, loading]);

  const toggle = async (album) => {
    const inAlbum = containsPost(album);
    setPending((p) => ({ ...p, [album._id]: true }));
    setError('');
    try {
      const res = await fetch(inAlbum ? `/api/remove/album/${album._id}` : '/api/add/post', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ postId, albumId: album._id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not update album.');
      replaceAlbum(data.album);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending((p) => ({ ...p, [album._id]: false }));
    }
  };

  const createAndAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/create/album', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title: newTitle.trim(), description: newDescription.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not create album.');

      setAlbums((prev) => [data.album, ...prev]);
      setNewTitle('');
      setNewDescription('');
      await toggle(data.album); // put the post straight into the new album
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onHide()}
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-left">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-slate-100">Save to album</h3>
          <button type="button" onClick={onHide} aria-label="Close" className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">✕</button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 text-xs rounded-lg">{error}</div>
          )}

          {loading ? (
            <p className="text-xs text-slate-500">Loading your albums...</p>
          ) : albums.length === 0 ? (
            <p className="text-xs text-slate-500">You don't have any albums yet. Create one below.</p>
          ) : (
            <ul className="space-y-1">
              {albums.map((album) => {
                const checked = containsPost(album);
                return (
                  <li key={album._id}>
                    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!!pending[album._id]}
                        onChange={() => toggle(album)}
                        className="w-4 h-4 accent-indigo-500"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-slate-200 truncate">{album.title}</span>
                        <span className="block text-[10px] text-slate-500">
                          {(album.postId || []).length} photo{(album.postId || []).length === 1 ? '' : 's'}
                        </span>
                      </span>
                      {pending[album._id] && <span className="text-[10px] text-slate-500">saving...</span>}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <form onSubmit={createAndAdd} className="pt-4 border-t border-slate-800 space-y-2">
            <p className="text-xs font-semibold text-slate-300">New album</p>
            <input
              type="text"
              placeholder="Album title"
              value={newTitle}
              maxLength={60}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDescription}
              maxLength={200}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!newTitle.trim() || creating}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create album & add post'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddToAlbumModal;
