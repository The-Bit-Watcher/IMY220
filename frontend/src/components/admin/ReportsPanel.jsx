import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorBox from '../common/ErrorBox';
import { api } from '../../services/api';
import { useConfirm } from '../../context/ConfirmContext';

function ReportsPanel() {
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => api('/api/admin/reports').then((d) => setRows(d.reportedPosts)), []);

  useEffect(() => {
    load().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [load]);

  const act = async (postId, action) => {
    const ok = action === 'delete'
      ? await confirm({ title: 'Delete reported post?', message: 'The post, its comments and reports will be removed permanently.', confirmLabel: 'Delete post', danger: true })
      : await confirm({ title: 'Dismiss reports?', message: 'The post stays up and its reports are cleared.', confirmLabel: 'Dismiss' });
    if (!ok) return;
    setBusy(postId);
    setError('');
    try {
      await api(action === 'delete' ? `/api/admin/posts/${postId}` : `/api/admin/reports/post/${postId}`, { method: 'DELETE' });
      setRows((prev) => prev.filter((r) => r.post._id !== postId));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <p className="text-sm text-slate-400">Loading reports...</p>;

  return (
    <div className="space-y-4">
      <ErrorBox message={error} />
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400 bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">No open reports. 🎉</p>
      ) : (
        rows.map(({ post, reports }) => (
          <article key={post._id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
            <Link to={`/post/${post._id}`} className="shrink-0">
              <img src={post.image} alt={post.caption} className="w-full sm:w-32 h-32 object-cover rounded-lg" />
            </Link>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${reports.length > 2 ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {reports.length} report{reports.length === 1 ? '' : 's'}{reports.length > 2 ? ' · hidden from feeds' : ''}
                </span>
                <Link to={`/post/${post._id}`} className="text-sm font-semibold text-slate-100 hover:text-indigo-300 truncate">{post.caption}</Link>
              </div>
              <p className="text-xs text-slate-500">by @{post.userId?.username || 'unknown'}</p>
              <ul className="space-y-1">
                {reports.map((r) => (
                  <li key={r._id} className="text-xs text-slate-300">
                    <strong className="text-slate-100">{r.reason}</strong>
                    {r.additionalDetails && <> · “{r.additionalDetails}”</>}
                    <span className="text-slate-500"> · @{r.reportedBy?.username || 'deleted user'}, {new Date(r.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-1">
                <button type="button" disabled={busy === post._id} onClick={() => act(post._id, 'dismiss')} className="btn btn-secondary">Dismiss reports</button>
                <button type="button" disabled={busy === post._id} onClick={() => act(post._id, 'delete')} className="btn btn-danger">Delete post</button>
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}

export default ReportsPanel;
