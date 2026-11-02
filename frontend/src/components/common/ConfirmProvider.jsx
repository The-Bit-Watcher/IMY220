import { useCallback, useRef, useState } from 'react';
import Modal from './Modal';
import { ConfirmContext } from '../../context/ConfirmContext';

// Styled replacement for window.confirm. useConfirm() returns a Promise<boolean>.
function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setDialog({ confirmLabel: 'Confirm', danger: false, ...options });
      }),
    []
  );

  const close = (answer) => {
    resolver.current?.(answer);
    resolver.current = null;
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <Modal title={dialog.title} onClose={() => close(false)} size="sm" danger={dialog.danger}>
          <div className="p-6 space-y-5">
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{dialog.message}</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => close(false)} className="btn btn-secondary">Cancel</button>
              <button type="button" autoFocus onClick={() => close(true)} className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`}>
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export default ConfirmProvider;
