import { useState } from 'react';
import Modal from '../common/Modal';
import TagInput from '../common/TagInput';
import ErrorBox from '../common/ErrorBox';

// Edit a post's description and hashtags. onSave returns { ok, message }.
function EditPost({ post, onHide, onSave, asAdmin = false }) {
  const [caption, setCaption] = useState(post?.caption || '');
  const [tags, setTags] = useState((post?.hashtags || []).map((t) => t.replace(/^#/, '')));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim()) return setError('The description cannot be empty.');
    setSaving(true);
    setError('');
    const result = await onSave({ caption: caption.trim(), hashtags: tags });
    if (result.ok) onHide();
    else {
      setError(result.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={asAdmin ? 'Edit post (admin)' : 'Edit post'} onClose={onHide} busy={saving} size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <ErrorBox message={error} />
        <div>
          <label htmlFor="edit-post-caption" className="field-label">Description</label>
          <textarea id="edit-post-caption" rows={4} maxLength={2200} value={caption}
            onChange={(e) => setCaption(e.target.value)} className="field-input resize-none" />
        </div>
        <div>
          <label htmlFor="edit-post-tags" className="field-label">Hashtags</label>
          <TagInput id="edit-post-tags" tags={tags} onChange={setTags} />
        </div>
        <p className="text-xs text-slate-500">The photo itself can't be changed after posting.</p>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onHide} disabled={saving} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default EditPost;
