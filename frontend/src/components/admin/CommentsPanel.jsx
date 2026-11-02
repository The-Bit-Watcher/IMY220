import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorBox from '../common/ErrorBox';
import { api } from '../../services/api';
import { useConfirm } from '../../context/ConfirmContext';

// Recent activity (comments) across the whole site, editable/deletable by admins
function CommentsPanel() {
  const confirm = useConfirm();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    api('/api/admin/comments')
      .then((d) => setComments(d.comments))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { comment } = await api(`/api/comments/${editingId}`, { method: 'PUT', body: { text: draft } });
      setComments((prev) => prev.map((c) => (c._id === editingId ? { ...c, text: comment.text } : c)));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!(await confirm({ title: 'Delete comment?', message: 'This comment will be removed permanently.', confirmLabel: 'Delete', danger: true }))) return;
    setError('');
    try {
      await api(`/api/comments/${id}`, { method: 'DELETE' });
      setComments((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="text-sm text-slate-400">Loading activity...</p>;

  return (
    <div className="space-y-4">
      <ErrorBox message={error} />
      {comments.length === 0 ? (
        <p className="text-sm text-slate-400">No comments yet.</p>
      ) : (
        <ul className="divide-y divide-slate-800 bg-slate-900 border border-slate-800 rounded-xl">
          {comments.map((c) => (
            <li key={c._id} className="p-3 space-y-1.5">
              <p className="text-[11px] text-slate-500">
                <strong className="text-slate-300">@{c.userId?.username || 'deleted user'}</strong> on{' '}
                {c.postId ? <Link to={`/post/${c.postId._id}`} className="text-link">“{c.postId.caption.slice(0, 50)}”</Link> : 'a deleted post'}
                {' · '}{new Date(c.createdAt).toLocaleString()}
              </p>
              {editingId === c._id ? (
                <form onSubmit={save} className="space-y-2">
                  <label htmlFor={`admin-comment-${c._id}`} className="sr-only">Edit comment</label>
                  <textarea id={`admin-comment-${c._id}`} rows={2} maxLength={1000} value={draft} onChange={(e) => setDraft(e.target.value)}
                    className="field-input !text-xs resize-none" />
                  <div className="flex gap-2">
                    <button type="submit" disabled={!draft.trim()} className="btn btn-primary">Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="btn btn-secondary">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start gap-3">
                  <p className="flex-1 text-sm text-slate-200 break-words">{c.text}</p>
                  <button type="button" onClick={() => { setEditingId(c._id); setDraft(c.text); }} className="btn btn-secondary !py-1">Edit</button>
                  <button type="button" onClick={() => remove(c._id)} className="btn btn-ghost-danger !py-1">Delete</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CommentsPanel;
