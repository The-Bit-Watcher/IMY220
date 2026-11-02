import { useEffect, useState } from 'react';
import ErrorBox from '../common/ErrorBox';
import { api } from '../../services/api';

// Own profile only (non-admins): shows the verification rules, your progress, and the request button
function VerificationCard() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    api('/api/verification/me')
      .then((data) => active && setStatus(data))
      .catch((err) => active && setError(err.message));
    return () => { active = false; };
  }, []);

  const request = async () => {
    setSending(true);
    setError('');
    try {
      const data = await api('/api/verification/request', { method: 'POST' });
      setStatus((s) => ({ ...s, request: data.request }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (!status) {
    return error ? <ErrorBox message={error} /> : null;
  }
  if (status.isAdmin) return null;

  const pending = status.request?.status === 'pending';
  const denied = status.request?.status === 'denied';

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <h2 className="font-bold text-slate-200 text-sm m-0 flex items-center gap-2">
        Verification
        {status.verified && <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">Verified</span>}
      </h2>

      {status.verified ? (
        <p className="text-xs text-slate-400">Your account is verified. The blue check shows next to your name everywhere.</p>
      ) : (
        <>
          <ul className="space-y-1.5">
            {status.checks.map((c) => (
              <li key={c.key} className="flex items-center gap-2 text-xs">
                <span aria-hidden="true" className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${c.met ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                  {c.met ? '✓' : '•'}
                </span>
                <span className={c.met ? 'text-slate-300' : 'text-slate-400'}>{c.label}</span>
                <span className="ml-auto text-slate-500">{c.have}/{c.need}</span>
                <span className="sr-only">{c.met ? 'done' : 'not yet'}</span>
              </li>
            ))}
          </ul>

          <ErrorBox message={error} />
          {pending && <ErrorBox tone="success" message="Request sent. An admin will review it soon." />}
          {denied && !pending && (
            <p className="text-[11px] text-amber-300">Your last request was denied. You can ask again.</p>
          )}

          {!pending && (
            <button type="button" onClick={request} disabled={!status.eligible || sending} className="btn btn-primary w-full">
              {sending ? 'Sending...' : status.eligible ? 'Request verification' : 'Not eligible yet'}
            </button>
          )}
        </>
      )}
    </section>
  );
}

export default VerificationCard;
