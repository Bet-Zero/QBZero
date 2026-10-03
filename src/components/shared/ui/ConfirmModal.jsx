// ConfirmModal.jsx
// In-app replacement for window.confirm. Use the hook:
//
//   const { confirm, confirmDialog } = useConfirm();
//   if (!(await confirm({ title: 'Clear the board?', confirmLabel: 'Clear' })))
//     return;
//   ...
//   return <>{...}{confirmDialog}</>;
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/shared/ui/Dialog';

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) => {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (isOpen) confirmRef.current?.focus();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="p-6 max-w-md">
        <h2 className="text-xl font-bold mb-2 text-white">{title}</h2>
        {message && <p className="text-sm text-white/70 mb-4">{message}</p>}
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onCancel}
            className="text-white/60 hover:text-white text-sm px-3 py-2"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-4 py-2 rounded text-white ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-neutral-600 hover:bg-neutral-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/** `confirm(options)` resolves to true or false once the person answers. */
export const useConfirm = () => {
  const [request, setRequest] = useState(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setRequest({ ...options, resolve });
      }),
    []
  );

  const answer = (value) => {
    request?.resolve(value);
    setRequest(null);
  };

  const confirmDialog = (
    <ConfirmModal
      isOpen={!!request}
      {...(request || {})}
      onConfirm={() => answer(true)}
      onCancel={() => answer(false)}
    />
  );

  return { confirm, confirmDialog };
};
