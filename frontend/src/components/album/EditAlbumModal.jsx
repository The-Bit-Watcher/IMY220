import { useState } from 'react';
import Modal from '../common/Modal';
import TagInput from '../common/TagInput';
import ErrorBox from '../common/ErrorBox';
import { api } from '../../services/api';

function EditAlbumModal({ album, onHide, onSaved }) {
  const [title, setTitle] = useState(album.title || '');
  const [description, setDescription] = useState(album.description || '');
  const [tags, setTags] = useState(album.hashtags || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Title cannot be empty.');
    setSaving(true);
    setError('');
    try {
      const data = await api(`/api/update/album/${album._id}`, {
        method: 'PUT',
        body: { title: title.trim(), description: description.trim(), hashtags: tags },
      });
      onSaved(data.album);
      onHide();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit album" onClose={onHide} busy={saving} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          <ErrorBox message={error} />
          <div>
            <label htmlFor="album-title" className="field-label">Name</label>
            <input id="album-title" type="text" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} className="field-input" />
          </div>
          <div>
            <label htmlFor="album-description" className="field-label">Description</label>
            <textarea id="album-description" rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)}
              className="field-input resize-none" />
          </div>
          <div>
            <label htmlFor="album-tags" className="field-label">Hashtags</label>
            <TagInput id="album-tags" tags={tags} onChange={setTags} />
            <p className="mt-1 text-[11px] text-slate-500">Tags from photos you add later are added automatically.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <button type="button" onClick={onHide} disabled={saving} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default EditAlbumModal;
