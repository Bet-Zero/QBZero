// NamePromptModal.jsx
// In-app replacement for window.prompt: asks for one short name.
import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/shared/ui/Dialog';

/**
 * `onSubmit(name)` receives the trimmed name. It may return (or resolve to)
 * an error message to keep the dialog open and show it; anything else
 * closes the dialog.
 */
const NamePromptModal = ({
  isOpen,
  title,
  description,
  initialValue = '',
  placeholder = '',
  confirmLabel = 'Save',
  onSubmit,
  onClose,
}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setError('');
      setBusy(false);
      // Typing straight away is the point of the dialog.
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isOpen, initialValue]);

  const submit = async () => {
    const name = value.trim();
    if (!name) {
      setError('Enter a name.');
      return;
    }
    setBusy(true);
    const result = await onSubmit(name);
    setBusy(false);
    if (typeof result === 'string' && result) {
      setError(result);
      return;
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-6 max-w-md">
        <h2 className="text-xl font-bold mb-2 text-white">{title}</h2>
        {description && (
          <p className="text-sm text-white/60 mb-4">{description}</p>
        )}
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !busy) submit();
          }}
          placeholder={placeholder}
          aria-label={title}
          className="w-full p-2 bg-neutral-800 text-white border border-white/20 rounded mb-2 placeholder:text-white/40"
        />
        {error && (
          <p role="alert" className="text-red-400 text-sm mb-2">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-sm px-3 py-2"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NamePromptModal;
