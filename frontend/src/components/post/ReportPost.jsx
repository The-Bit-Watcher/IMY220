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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h3 className="text-lg font-semibold text-red-600">Report Post</h3>
          <button onClick={onHide} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
        </div>

        {submitted ? (
          <div className="p-4">
            <div>
              Thank you. Your report has been submitted for moderation.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div>
              <p>
                Please select a reason why you are reporting this content:
              </p>

              <div className="space-y-2">
                {reasons.map((reason, index) => (
                  <label key={index} className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                    />
                    <span className="text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide extra context if needed..."
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div>
              <button 
                type="button" 
                onClick={onHide}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!selectedReason}
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