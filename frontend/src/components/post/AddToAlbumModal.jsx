import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import ErrorBox from '../common/ErrorBox';
import { api } from '../../services/api';

// Lists the logged-in user's albums with a checkbox per album, plus "create new album".
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
    api('/api/get/albums/me')
      .then((data) => active && setAlbums(data.albums))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  // Keep the post page's "In N albums" label in sync
  const update = (next) => {
    setAlbums(next);
    onChange?.(next.filter(containsPost).map((a) => a._id));
  };

  const toggle = async (album, list = albums) => {
    const inAlbum = containsPost(album);
    setPending((p) => ({ ...p, [album._id]: true }));
    setError('');
    try {
      const data = await api(inAlbum ? `/api/remove/album/${album._id}` : '/api/add/post', {
        method: 'POST',
        body: { postId, albumId: album._id },
      });
      update(list.map((a) => (a._id === album._id ? { ...a, postId: data.album.postId } : a)));
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
      const data = await api('/api/create/album', {
        method: 'POST',
        body: { title: newTitle.trim(), description: newDescription.trim(), postIds: [postId] },
      });
      update([data.album, ...albums]);
      setNewTitle('');
      setNewDescription('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal title="Save to album" onClose={onHide}>
      <div className="p-6 space-y-4">
        <ErrorBox message={error} />

        {loading ? (
          <p className="text-xs text-slate-500">Loading your albums...</p>
        ) : albums.length === 0 ? (
          <p className="text-xs text-slate-500">You don't have any albums yet. Create one below.</p>
        ) : (
          <ul className="space-y-1">
            {albums.map((album) => {
              const count = (album.postId || []).length;
              return (
                <li key={album._id}>
                  <label htmlFor={`album-${album._id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/60">
                    <input id={`album-${album._id}`} type="checkbox" checked={containsPost(album)} disabled={!!pending[album._id]}
                      onChange={() => toggle(album)} className="w-4 h-4 accent-indigo-500" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-slate-200 truncate">{album.title}</span>
                      <span className="block text-[10px] text-slate-500">{count} photo{count === 1 ? '' : 's'}</span>
                    </span>
                    {pending[album._id] && <span className="text-[10px] text-slate-500">saving...</span>}
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={createAndAdd} className="pt-4 border-t border-slate-800 space-y-3">
          <p className="text-xs font-semibold text-slate-300">New album with this photo</p>
          <div>
            <label htmlFor="new-album-title" className="field-label">Title</label>
            <input id="new-album-title" type="text" placeholder="e.g. Summer 2026" value={newTitle} maxLength={80}
              onChange={(e) => setNewTitle(e.target.value)} className="field-input !text-xs" />
          </div>
          <div>
            <label htmlFor="new-album-desc" className="field-label">Description (optional)</label>
            <input id="new-album-desc" type="text" value={newDescription} maxLength={500}
              onChange={(e) => setNewDescription(e.target.value)} className="field-input !text-xs" />
          </div>
          <button type="submit" disabled={!newTitle.trim() || creating} className="btn btn-primary w-full">
            {creating ? 'Creating...' : 'Create album & add photo'}
          </button>
        </form>
      </div>
    </Modal>
  );
}

export default AddToAlbumModal;
