import React, { useState } from 'react';

function ReportPostModal({ show, onHide, postId, reasons = [], onSubmitReport }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedReason) return;

    if (onSubmitReport) {
      onSubmitReport({
        postId,
        reason: selectedReason,
        details: additionalDetails,
        reportedAt: new Date().toISOString()
      });
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedReason('');
      setAdditionalDetails('');
      onHide();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
            Report Post
          </h3>
          <button
            type="button"
            onClick={onHide}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-2">
            <h4 className="font-semibold text-slate-100">Report Submitted</h4>
            <p className="text-xs text-slate-400">
              Thank you for keeping our community safe. Our team will review this post shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-xs text-slate-400">
              Please select a primary reason why you are reporting this content:
            </p>

            <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {reasons.map((reason, index) => (
                <label key={index} className="flex items-center space-x-3 text-xs text-slate-200 cursor-pointer p-1.5 hover:bg-slate-800/50 rounded-lg transition-colors">
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Provide additional context to help our moderation team..."
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onHide}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedReason}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-600/20"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReportPostModal;