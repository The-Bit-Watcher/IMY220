import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { AvatarDisplay } from '../../utils/avatarGenerator';
import VerifiedBadge from '../common/VerifiedBadge';

function CommentItem({ comment, canEdit, canDelete, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.text);
  const [saving, setSaving] = useState(false);
  const editId = useId();

  const author = comment.userId && typeof comment.userId === 'object' ? comment.userId : null;
  const authorName = author?.name || author?.username || 'Unknown user';

  const save = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    const ok = await onEdit(comment._id, text.trim());
    setSaving(false);
    if (ok) setEditing(false);
  };

  return (
    <li className="flex gap-2.5 py-1.5">
      <AvatarDisplay username={authorName} src={author?.profileImage} className="w-7 h-7 text-[10px] shrink-0" />
      <div className="min-w-0 flex-1 text-xs">
        <div className="flex flex-wrap items-baseline gap-x-2">
          {author ? (
            <Link to={`/profile/${author._id}`} className="inline-flex items-center gap-1 font-semibold text-slate-100 hover:text-indigo-300">{authorName}<VerifiedBadge user={author} /></Link>
          ) : (
            <span className="font-semibold text-slate-100">{authorName}</span>
          )}
          {comment.createdAt && (
            <time dateTime={comment.createdAt} className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</time>
          )}
        </div>

        {editing ? (
          <form onSubmit={save} className="mt-1 space-y-1.5">
            <label htmlFor={editId} className="sr-only">Edit comment</label>
            <textarea id={editId} rows={2} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)}
              className="field-input !text-xs resize-none" />
            <div className="flex gap-2">
              <button type="submit" disabled={saving || !text.trim()} className="btn btn-primary !py-1 !px-2.5">{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={() => { setEditing(false); setText(comment.text); }} className="btn btn-secondary !py-1 !px-2.5">Cancel</button>
            </div>
          </form>
        ) : (
          <p className="text-slate-300 break-words whitespace-pre-line">{comment.text}</p>
        )}

        {!editing && (canEdit || canDelete) && (
          <div className="flex gap-3 mt-0.5">
            {canEdit && (
              <button type="button" onClick={() => setEditing(true)} className="text-[10px] text-slate-500 hover:text-indigo-300">Edit</button>
            )}
            {canDelete && (
              <button type="button" onClick={() => onDelete(comment._id)} className="text-[10px] text-slate-500 hover:text-rose-400">Delete</button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

// Comment list + "add comment" form. Permission checks are passed in by the page.
function PostComments({ comments = [], onAddComment, onEditComment, onDeleteComment, canEdit = () => false, canDelete = () => false }) {
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const inputId = useId();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    setSending(true);
    const ok = await onAddComment(text);
    setSending(false);
    if (ok) setCommentText('');
  };

  return (
    <div className="mt-3 space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">Add a comment</label>
        <input id={inputId} type="text" maxLength={1000} placeholder="Add a comment..." value={commentText}
          onChange={(e) => setCommentText(e.target.value)} className="field-input !text-xs !py-2" />
        <button type="submit" disabled={!commentText.trim() || sending} className="btn btn-primary">Post</button>
      </form>

      {comments.length === 0 ? (
        <p className="text-xs text-slate-500">No comments yet. Be the first.</p>
      ) : (
        <ul className="space-y-1">
          {comments.map((c) => (
            <CommentItem key={c._id} comment={c} canEdit={canEdit(c)} canDelete={canDelete(c)}
              onEdit={onEditComment} onDelete={onDeleteComment} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default PostComments;
