import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorBox from '../common/ErrorBox';
import VerifiedBadge from '../common/VerifiedBadge';
import { AvatarDisplay } from '../../utils/avatarGenerator';
import { api } from '../../services/api';

const STATUS_STYLE = {
  pending: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-emerald-500/20 text-emerald-300',
  denied: 'bg-rose-500/20 text-rose-300',
};

// Verification requests, approved or denied one at a time
function VerificationsPanel() {
  const [filter, setFilter] = useState('pending');
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let active = true;
    api(`/api/admin/verifications?status=${filter}`)
      .then((d) => active && setRequests(d.requests))
      .catch((err) => active && setError(err.message));
    return () => { active = false; };
  }, [filter]);

  const review = async (id, action) => {
    setBusy(id);
    setError('');
    try {
      const { request } = await api(`/api/admin/verifications/${id}/${action}`, { method: 'POST' });
      setRequests((prev) => (filter === 'pending'
        ? prev.filter((r) => r._id !== id)
        : prev.map((r) => (r._id === id ? { ...r, status: request.status, reviewedAt: request.reviewedAt } : r))));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-xs text-slate-400 max-w-lg">
          Users can ask once their account is over a week old with at least 2 posts and 5 comments.
          “Now” shows their current numbers, so check they still qualify.
        </p>
        <div>
          <label htmlFor="verification-filter" className="field-label">Show</label>
          <select id="verification-filter" value={filter} onChange={(e) => { setRequests(null); setFilter(e.target.value); }} className="field-input !py-1.5 !text-xs">
            <option value="pending">Waiting for review</option>
            <option value="all">All requests</option>
          </select>
        </div>
      </div>

      <ErrorBox message={error} />

      {!requests ? (
        <p className="text-sm text-slate-400">Loading requests...</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-slate-400 bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">No requests to review.</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => {
            const u = r.userId;
            const now = r.current;
            return (
              <li key={r._id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
                <Link to={`/profile/${u._id}`} className="flex items-center gap-3 min-w-0 md:w-56 group">
                  <AvatarDisplay username={u.name} src={u.profileImage} className="w-10 h-10 text-xs shrink-0" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 text-sm font-semibold text-slate-100 group-hover:text-indigo-300">
                      <span className="truncate">{u.name}</span><VerifiedBadge user={u} />
                    </span>
                    <span className="block text-xs text-slate-500 truncate">@{u.username}</span>
                  </span>
                </Link>

                <dl className="grid grid-cols-3 gap-3 flex-1 text-xs">
                  {[['Account age', 'accountAgeDays', 'days', 8], ['Posts', 'posts', '', 2], ['Comments', 'comments', '', 5]].map(([label, key, unit, need]) => (
                    <div key={key}>
                      <dt className="text-slate-500">{label}</dt>
                      <dd className={`font-semibold ${now[key] >= need ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {now[key]} {unit}
                        <span className="text-slate-500 font-normal"> · asked with {r.snapshot?.[key] ?? '?'}</span>
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="flex items-center gap-2 shrink-0">
                  {r.status === 'pending' ? (
                    <>
                      <button type="button" disabled={busy === r._id} onClick={() => review(r._id, 'deny')} className="btn btn-ghost-danger">Deny</button>
                      <button type="button" disabled={busy === r._id} onClick={() => review(r._id, 'approve')} className="btn bg-emerald-600 hover:bg-emerald-500 text-white">Approve</button>
                    </>
                  ) : (
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full capitalize ${STATUS_STYLE[r.status]}`}>
                      {r.status}{r.reviewedAt ? ` · ${new Date(r.reviewedAt).toLocaleDateString()}` : ''}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default VerificationsPanel;
