import { useEffect, useId } from 'react';

const SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

// Shared modal shell: overlay, title bar, close button, Escape / click-outside to close.
function Modal({ title, onClose, busy = false, size = 'md', danger = false, children }) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-overlay backdrop-blur-sm p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full ${SIZES[size]} max-h-[90vh] flex flex-col bg-slate-900 border ${danger ? 'border-rose-500/40' : 'border-slate-800'} rounded-2xl shadow-2xl overflow-hidden text-left text-slate-100`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 id={titleId} className={`font-heading text-lg font-bold m-0 ${danger ? 'text-rose-400' : 'text-slate-100'}`}>{title}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close"
            className="text-slate-400 hover:text-slate-50 p-1 rounded-lg hover:bg-slate-800 disabled:opacity-40">✕</button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
