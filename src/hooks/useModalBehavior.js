import { useCallback, useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * The behaviour every dialog is expected to have and none of these had.
 *
 * Escape closes, Tab stays inside, focus lands somewhere useful on open and
 * returns where it came from on close. Without the trap, tabbing ran straight
 * out of the dialog into the page behind it -- which is invisible with a mouse
 * and makes the dialog unusable from a keyboard.
 *
 * Returns a ref for the dialog panel and a backdrop handler. Callers still set
 * `role="dialog"` and `aria-modal="true"` themselves, since only they know what
 * labels the dialog.
 *
 * @param {Function} onClose
 * @param {{ closeOnBackdrop?: boolean }} options - off where a stray click
 *   would discard typing.
 */
const useModalBehavior = (onClose, { closeOnBackdrop = true } = {}) => {
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const panel = panelRef.current;
    if (panel) {
      // Prefer the first real control; fall back to the panel, which needs a
      // tabIndex of -1 for this to take.
      const first = panel.querySelector(FOCUSABLE);
      (first instanceof HTMLElement ? first : panel).focus?.({
        preventScroll: true,
      });
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null || node === document.activeElement
      );
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const onBackdropMouseDown = useCallback(
    (event) => {
      // Only a click that both starts and ends on the backdrop counts, so a
      // drag that happens to finish outside the panel does not close it.
      if (!closeOnBackdrop) return;
      if (event.target !== event.currentTarget) return;
      onClose?.();
    },
    [closeOnBackdrop, onClose]
  );

  return { panelRef, onBackdropMouseDown };
};

export default useModalBehavior;
