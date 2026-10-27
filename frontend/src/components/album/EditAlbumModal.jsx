import React, { useEffect, useState } from 'react';
import TagInput from '../common/TagInput';
import { authHeaders } from '../../utils/session';

const inputClass =
  'w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500';

function EditAlbumModal({ album, onHide, onSaved }) {
  const [title, setTitle] = useState(album.title || '');
  const [description, setDescription] = useState(album.description || '');
  const [tags, setTags] = useState(album.hashtags || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !saving && onHide();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onHide, saving]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Title cannot be empty.');
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/update/album/${album._id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ title: title.trim(), description: description.trim(), hashtags: tags }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not save album.');
      onSaved(data.album);
      onHide();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onHide()}>
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-left">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-slate-100">Edit album</h3>
          <button type="button" onClick={onHide} aria-label="Close" className="text-slate-400 hover:text-white p-1">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 text-xs rounded-lg">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Title</label>
            <input type="text" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
            <textarea rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tags</label>
            <TagInput tags={tags} onChange={setTags} />
            <p className="mt-1 text-[11px] text-slate-500">Tags from photos you add later are added automatically.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <button type="button" onClick={onHide} disabled={saving}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300">Cancel</button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white disabled:opacity-50">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditAlbumModal;
