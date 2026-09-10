// src/components/roster/DrawerShell.jsx
import React, { useEffect } from 'react';

const DrawerShell = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`fixed left-0 top-0 h-full w-[300px] bg-[#1a1a1a] border-r border-white/10 z-20 flex flex-col transition-transform duration-200 ease-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {children}
      </div>
      {/* Presentational: Escape above is the keyboard equivalent. */}
      <div
        role="presentation"
        className={`fixed inset-0 bg-black/20 z-10 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
    </>
  );
};

export default DrawerShell;
