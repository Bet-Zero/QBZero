// dialog.jsx — simple modal wrapper for CreateListModal

import React, { useEffect } from 'react';

export const Dialog = ({ open, onOpenChange, children }) => {
  useEffect(() => {
    if (!open) return undefined;

    // Closing on backdrop click is mouse-only, so Escape is what makes the
    // dialog dismissable from the keyboard. The backdrop itself is marked
    // presentational: it duplicates that shortcut rather than offering
    // anything of its own.
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  // Only a click on the backdrop itself closes, so the panel below needs no
  // stopPropagation handler of its own.
  return (
    <div
      role="presentation"
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-[#111] border border-white/10 rounded-lg shadow-xl p-6 max-w-md w-full"
      >
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};
