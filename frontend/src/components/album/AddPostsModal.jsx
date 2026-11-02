import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../common/Modal';
import ErrorBox from '../common/ErrorBox';
import PostPicker from './PostPicker';
import { getStoredUser } from '../../utils/session';
import { api } from '../../services/api';

// Pick existing posts (your own) to add to an album
function AddPostsModal({ album, existingPostIds, onHide, onAdded }) {
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Snapshot once: the parent passes a new array every render
  const [excluded] = useState(() => new Set(existingPostIds.map(String)));

  useEffect(() => {
    let active = true;
    api(`/api/users/${getStoredUser().userId}/posts`)
      .then((data) => active && setPosts(data.posts.filter((p) => !excluded.has(String(p._id)))))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [excluded]);

  const handleAdd = async () => {
    setSaving(true);
    setError('');
    let added = 0;
    try {
      // One request per post: each one also merges that post's tags into the album
      for (const postId of selected) {
        await api('/api/add/post', { method: 'POST', body: { postId, albumId: album._id } });
        added += 1;
      }
      onAdded();
      onHide();
    } catch (err) {
      setError(err.message);
      if (added) onAdded(); // keep whatever did get added
      setSaving(false);
    }
  };

  return (
    <Modal title={`Add photos to “${album.title}”`} onClose={onHide} busy={saving} size="xl">
      <div className="p-6 space-y-4">
        <ErrorBox message={error} />
        {loading ? (
          <p className="text-xs text-slate-500">Loading your posts...</p>
        ) : (
          <PostPicker posts={posts} selected={selected} onChange={setSelected} emptyText="All your posts are already in this album." />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/50">
        <Link to={`/create?type=post&album=${album._id}`} className="text-xs text-link">+ Upload a new photo instead</Link>
        <div className="flex gap-3">
          <button type="button" onClick={onHide} disabled={saving} className="btn btn-secondary">Cancel</button>
          <button type="button" onClick={handleAdd} disabled={saving || selected.length === 0} className="btn btn-primary">
            {saving ? 'Adding...' : `Add ${selected.length || ''} photo${selected.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default AddPostsModal;
