import React from 'react';
import { Check, CloudOff, Loader2, AlertTriangle } from 'lucide-react';

/**
 * Shows what the autosave is doing.
 *
 * Editing used to give no feedback at all, so a save that never ran, one that
 * was rejected, and one that succeeded all looked the same — you only found out
 * by reloading and seeing your work gone.
 */
const SaveStatus = ({ saveState, saveError, onRetry }) => {
  if (saveState === 'idle') return null;

  if (saveState === 'error') {
    return (
      <div className="flex items-center gap-2 text-red-300 text-xs">
        <AlertTriangle size={14} />
        <span>Not saved: {saveError || 'unknown error'}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="underline hover:text-red-200"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (saveState === 'saving') {
    return (
      <div className="flex items-center gap-2 text-white/50 text-xs">
        <Loader2 size={14} className="animate-spin" />
        <span>Saving…</span>
      </div>
    );
  }

  if (saveState === 'pending') {
    return (
      <div className="flex items-center gap-2 text-white/40 text-xs">
        <CloudOff size={14} />
        <span>Unsaved changes</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-400/80 text-xs">
      <Check size={14} />
      <span>Saved</span>
    </div>
  );
};

export default SaveStatus;
