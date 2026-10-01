import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PostPicker from './PostPicker';
import { authHeaders, getStoredUser } from '../../utils/session';

// Pick existing posts (your own) to add to an album
function AddPostsModal({ album, existingPostIds, onHide, onAdded }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Snapshot once: the parent passes a new array every render
  const [excluded] = useState(() => new Set(existingPostIds.map(String)));

  useEffect(() => {
    let active = true;
    fetch(`/api/users/${getStoredUser().userId}/posts`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (active && data.success) {
          setPosts(data.posts.filter((p) => !excluded.has(String(p._id))));
        }
      })
      .catch(() => active && setError('Could not load your posts.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [excluded]);

  const handleAdd = async () => {
    setSaving(true);
    setError('');
    let latestAlbum = null;
    try {
      // One request per post: each one also merges that post's tags into the album
      for (const postId of selected) {
        const res = await fetch('/api/add/post', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ postId, albumId: album._id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || 'Could not add a post.');
        latestAlbum = data.album;
      }
      onAdded(latestAlbum);
      onHide();
    } catch (err) {
      setError(err.message);
      if (latestAlbum) onAdded(latestAlbum); // keep whatever did get added
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onHide()}>
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-left">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-slate-100">Add photos to “{album.title}”</h3>
          <button type="button" onClick={onHide} aria-label="Close" className="text-slate-400 hover:text-white p-1">✕</button>
        </div>
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {error && <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 text-xs rounded-lg">{error}</div>}
          {loading ? (
            <p className="text-xs text-slate-500">Loading your posts...</p>
          ) : (
            <PostPicker posts={posts} selected={selected} onChange={setSelected}
              emptyText="All your posts are already in this album." />
          )}
        </div>
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <button type="button" onClick={() => navigate(`/create?type=post&album=${album._id}`)}
            className="text-xs text-indigo-400 hover:underline">
            + Upload a new photo instead
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onHide} disabled={saving}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300">Cancel</button>
            <button type="button" onClick={handleAdd} disabled={saving || selected.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white disabled:opacity-50">
              {saving ? 'Adding...' : `Add ${selected.length || ''} photo${selected.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddPostsModal;
