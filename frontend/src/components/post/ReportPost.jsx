import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import ErrorBox from '../common/ErrorBox';
import { api } from '../../services/api';

// Report a post. Reasons come from the database so admins can add new ones.
function ReportPostModal({ onHide, onSubmitReport }) {
  const [reasons, setReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [status, setStatus] = useState('loading'); // loading | idle | sending | done
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api('/api/report-reasons')
      .then((data) => active && setReasons(data.reasons))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setStatus('idle'));
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReason) return setError('Please choose a reason.');
    setStatus('sending');
    setError('');
    const result = await onSubmitReport({ reason: selectedReason, additionalDetails: additionalDetails.trim() });
    if (result.ok) setStatus('done');
    else {
      setStatus('idle');
      setError(result.message);
    }
  };

  return (
    <Modal title="Report post" onClose={onHide} busy={status === 'sending'} danger>
      {status === 'done' ? (
        <div className="p-8 text-center space-y-4">
          <h3 className="font-semibold text-slate-100">Report submitted</h3>
          <p className="text-xs text-slate-400">Thanks for helping keep the community safe. An admin will review this post.</p>
          <button type="button" onClick={onHide} className="btn btn-secondary">Close</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <ErrorBox message={error} />
          <fieldset className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <legend className="field-label px-1">Why are you reporting this post?</legend>
            {status === 'loading' && <p className="text-xs text-slate-500 p-1.5">Loading reasons...</p>}
            {reasons.map((r) => (
              <label key={r._id} htmlFor={`reason-${r._id}`} className="flex items-center gap-3 text-xs text-slate-200 p-1.5 hover:bg-slate-800/50 rounded-lg">
                <input id={`reason-${r._id}`} type="radio" name="reportReason" value={r.name}
                  checked={selectedReason === r.name} onChange={(e) => setSelectedReason(e.target.value)} className="accent-rose-500" />
                {r.name}
              </label>
            ))}
          </fieldset>

          <div>
            <label htmlFor="report-details" className="field-label">Additional details (optional)</label>
            <textarea id="report-details" rows={3} maxLength={500} placeholder="Anything that helps the admins..."
              value={additionalDetails} onChange={(e) => setAdditionalDetails(e.target.value)} className="field-input !text-xs resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onHide} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={!selectedReason || status === 'sending'} className="btn btn-danger">
              {status === 'sending' ? 'Submitting...' : 'Submit report'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default ReportPostModal;
