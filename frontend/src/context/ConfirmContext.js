import { createContext, useContext } from 'react';

export const ConfirmContext = createContext(null);

// const confirm = useConfirm();
// if (await confirm({ title, message, confirmLabel, danger })) { ... }
export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return confirm;
}
