import React, { useState } from 'react';

// Must match the enum in backend/src/models/Report.js, otherwise the report is rejected
export const REPORT_REASONS = ['Spam', 'Inappropriate Content', 'Harassment', 'False Information', 'Other'];

function ReportPostModal({ onHide, onSubmitReport }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReason) return;

    setStatus('sending');
    setError('');
    // Parent returns { ok, message } so we only say "submitted" when it actually was
    const result = await onSubmitReport({ reason: selectedReason, additionalDetails: additionalDetails.trim() });
    if (result?.ok) {
      setStatus('done');
      setTimeout(onHide, 1500);
    } else {
      setStatus('idle');
      setError(result?.message || 'Could not submit report.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans"
      onMouseDown={(e) => e.target === e.currentTarget && status !== 'sending' && onHide()}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden text-left">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-red-500">Report Post</h3>
          <button type="button" onClick={onHide} aria-label="Close"
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800">
            ✕
          </button>
        </div>

        {status === 'done' ? (
          <div className="p-8 text-center space-y-2">
            <h4 className="font-semibold text-slate-100">Report submitted</h4>
            <p className="text-xs text-slate-400">Thank you for keeping our community safe. Our team will review this post shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 text-xs rounded-lg">{error}</div>
            )}
            <p className="text-xs text-slate-400">Why are you reporting this post?</p>

            <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {REPORT_REASONS.map((reason) => (
                <label key={reason} className="flex items-center gap-3 text-xs text-slate-200 cursor-pointer p-1.5 hover:bg-slate-800/50 rounded-lg">
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="accent-red-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Additional details (optional)
              </label>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Anything that helps the moderators..."
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={onHide}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800">
                Cancel
              </button>
              <button type="submit" disabled={!selectedReason || status === 'sending'}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {status === 'sending' ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReportPostModal;
