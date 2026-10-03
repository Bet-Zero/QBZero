import React, { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const PREFIX = 'qbzero:draft:';

// Storage throws in private browsing and when the quota is full. A draft is a
// safety net, so failing to keep one must never break the editor.
export const readDraft = (key) => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeDraft = (key, draft) => {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(draft));
  } catch {
    // Nothing to do: the edits are still on screen.
  }
};

export const clearDraft = (key) => {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Same as above.
  }
};

const when = (at) =>
  new Date(at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/**
 * Keeps an editor's unsaved changes in this browser, so closing or reloading
 * the tab loses nothing -- in place of the browser's "Leave site?" pop-up.
 *
 * While `dirty`, `snapshot` is written under `key`. Saving (dirty again false)
 * clears it, and so does leaving the page inside the site, which the editors
 * already ask about in-app. When the editor next opens and is `ready`, a draft
 * left behind is handed to `restore(snapshot, true)` with a toast that can
 * discard it, which calls `restore(savedSnapshot, false)`. If what is saved
 * changed after the draft was taken (another tab or device), the editor asks
 * with `confirm` first instead.
 */
const useUnsavedDraft = ({ key, ready, dirty, snapshot, restore, confirm }) => {
  // The key whose draft has been looked for. Nothing is written or cleared
  // before then, or a fresh load would wipe the draft it is about to restore.
  const checked = useRef(null);
  // Set while a restored draft has not shown up as dirty yet.
  const restoring = useRef(false);
  const serialized = JSON.stringify(snapshot ?? null);
  // The snapshot as last saved: whatever was on screen while not dirty.
  const saved = useRef(serialized);
  if (!dirty) saved.current = serialized;

  const latest = useRef();
  latest.current = { restore, confirm };

  useEffect(() => {
    if (!ready || !key || checked.current === key) return;
    checked.current = key;
    const draft = readDraft(key);
    if (!draft) return;

    const pristine = JSON.parse(saved.current);
    const apply = () => {
      restoring.current = true;
      latest.current.restore(draft.snapshot, true);
      toast(
        (t) => (
          <span className="flex items-center gap-3">
            <span>Picked up your unsaved changes from {when(draft.at)}.</span>
            <button
              type="button"
              onClick={() => {
                restoring.current = false;
                latest.current.restore(pristine, false);
                clearDraft(key);
                toast.dismiss(t.id);
              }}
              className="shrink-0 rounded bg-neutral-900 px-2 py-1 text-xs font-semibold text-white hover:bg-neutral-700"
            >
              Discard
            </button>
          </span>
        ),
        { id: `draft-${key}`, duration: 8000 }
      );
    };

    if (draft.base == null || draft.base === saved.current) {
      apply();
      return;
    }
    restoring.current = true;
    latest.current
      .confirm({
        title: 'Restore your unsaved changes?',
        message: `You left unsaved changes here on ${when(draft.at)}. This was saved again after that, so restoring them replaces the newer version once you save.`,
        confirmLabel: 'Restore',
        cancelLabel: 'Discard',
      })
      .then((yes) => {
        if (yes) {
          apply();
        } else {
          restoring.current = false;
          clearDraft(key);
        }
      });
  }, [ready, key]);

  useEffect(() => {
    if (!key || checked.current !== key) return;
    if (!dirty) {
      if (restoring.current) return;
      clearDraft(key);
      return;
    }
    restoring.current = false;
    // Keep the original time if this is the same draft coming back.
    const existing = readDraft(key);
    const at =
      existing && JSON.stringify(existing.snapshot) === serialized
        ? existing.at
        : Date.now();
    writeDraft(key, {
      snapshot: JSON.parse(serialized),
      base: saved.current,
      at,
    });
  }, [key, dirty, serialized]);

  // Leaving within the site is a choice the editor already confirmed in-app;
  // only a closed or reloaded tab, which never unmounts, keeps the draft.
  useEffect(
    () => () => {
      if (checked.current === key && !restoring.current) clearDraft(key);
    },
    [key]
  );
};

export default useUnsavedDraft;
