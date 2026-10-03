import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { savePlayerData } from '@/firebaseHelpers';
import useAuth from '@/hooks/useAuth';
import { teamOverrideForSave } from '@/utils/roster/teamOverride';

const AUTOSAVE_DEBOUNCE_MS = 1000;

// Firestore rejects a whole document if any field is `undefined`, so an
// optional value that never got filled in takes the entire save down with it.
// Borrowed from ScoutZero, where this is what makes profile autosave reliable.
const stripUndefinedDeep = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep).filter((item) => item !== undefined);
  }

  if (typeof value === 'object') {
    const cleaned = {};
    for (const [key, val] of Object.entries(value)) {
      const cleanedVal = stripUndefinedDeep(val);
      if (cleanedVal !== undefined) cleaned[key] = cleanedVal;
    }
    return cleaned;
  }

  return value;
};

// What a player edit is allowed to change, plus the identity fields a record
// needs to be found again.
//
// This used to write the whole normalized player back, round-tripping derived
// values (formattedPosition, heightInInches, salaryByYear, the lifted stat
// columns) into storage where the next normalize pass recomputes them anyway.
// bio is kept deliberately: usePlayerData only merges a document whose nested
// bio.Position is 'QB', so a record saved without it is dropped on reload and
// the edit looks like it never saved.
//
// `team` is the one bio field the profile edits, so a trade can be recorded
// without a service-account key and populateQBs. It is merged over the saved
// bio rather than replacing it, and an actual change also writes
// team_override so the next populateQBs run keeps it (see teamOverride.js).
const buildPlayerUpdate = ({
  player,
  team,
  traits,
  roles,
  subRoles,
  badges,
  runningProfile,
  overallGrade,
  status,
  blurbs,
}) =>
  stripUndefinedDeep({
    player_id: player.player_id ?? player.id,
    display_name: player.display_name ?? player.name ?? '',
    bio: { ...(player.bio ?? {}), ...(team ? { Team: team } : {}) },
    team_override: teamOverrideForSave({ player, team }),
    traits,
    roles,
    subRoles,
    badges,
    runningProfile,
    overall_grade: overallGrade ?? null,
    status,
    blurbs,
  });

/**
 * Debounced autosave for the player profile editor.
 *
 * Returns the save state so the page can show it. A silent autosave is
 * indistinguishable from one that never ran, which is exactly how this went
 * unnoticed: the previous version reported nothing at all.
 *
 * Each change captures a snapshot of that player's values, and that snapshot
 * is what gets written. Two ways an edit used to vanish without an error:
 *
 * - Moving to another player (arrows, search, dropdown) inside the debounce
 *   window cancelled the timer, and the next player's load cleared the dirty
 *   flag. The pending snapshot is now written immediately instead, and the
 *   same happens when the page unmounts.
 * - A save that came due while another was in flight returned early and was
 *   never retried, and the first save then cleared the dirty flag over it.
 *   Saves now queue behind each other.
 *
 * `onSaved(playerId, update)` reports what was written, so the page can keep
 * its copy of the record current. The list is fetched once, so without that a
 * player you return to shows the values from page load -- and the next edit
 * writes them back over the ones you saved.
 */
const useAutoSavePlayer = ({
  playerId,
  player,
  team,
  traits,
  roles,
  subRoles,
  badges,
  runningProfile,
  overallGrade,
  status,
  blurbs,
  hasChanges,
  setHasChanges,
  onSaved,
}) => {
  const { user, isAdmin } = useAuth();
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState(null);

  // Saves resolve later, so read these from refs rather than closing over
  // whatever they were when the save was queued.
  const contextRef = useRef(null);
  contextRef.current = { user, isAdmin, setHasChanges, onSaved };

  // The latest unsaved snapshot, or null once it has been handed to a save.
  const pendingRef = useRef(null);
  const timerRef = useRef(null);
  const queueRef = useRef(Promise.resolve());
  // Snapshots handed to the queue and not yet written.
  const queuedRef = useRef(0);
  const mountedRef = useRef(true);

  const write = useCallback(async (snapshot) => {
    const ctx = contextRef.current;
    const update = buildPlayerUpdate(snapshot);
    if (mountedRef.current) {
      setSaveState('saving');
      setSaveError(null);
    }

    try {
      await savePlayerData(snapshot.playerId, update);
      contextRef.current.onSaved?.(snapshot.playerId, update);
      // A newer edit may have been queued while this one was in flight; it is
      // still unsaved, so the flag stays up for it.
      if (mountedRef.current && !pendingRef.current && queuedRef.current <= 1) {
        setSaveState('saved');
        contextRef.current.setHasChanges(false);
      }
      // A shared id so rapid edits replace the toast instead of stacking.
      toast.success('Saved', { id: 'player-autosave', duration: 1500 });
    } catch (error) {
      // Leave hasChanges set: the edit is unsaved, and saying so beats
      // clearing the flag and letting it disappear on the next reload.
      console.error('Error auto-saving player:', error);

      // A rules rejection has two quite different causes, and saying the wrong
      // one sends you hunting in the wrong place.
      //
      // If this app already believes you are an admin, it read admins/<uid>
      // successfully -- so the account is fine and the rules refusing the write
      // are not the ones in firestore.rules. That file lives in the repo and
      // does nothing until it is published to Firebase.
      const denied =
        error?.code === 'permission-denied' ||
        /insufficient permissions/i.test(error?.message || '');

      let message;
      if (!denied) {
        message = `Not saved: ${error?.message || 'unknown error'}`;
      } else if (ctx.isAdmin) {
        message =
          'Not saved: your account is an admin here, so the rules in Firebase ' +
          'are probably not the ones in firestore.rules. Publish that file in ' +
          'the Firebase console under Firestore \u2192 Rules.';
      } else if (ctx.user) {
        message = `Not saved: ${ctx.user.email} is not an admin account.`;
      } else {
        message = 'Not saved: you are not signed in.';
      }

      if (mountedRef.current) {
        setSaveState('error');
        setSaveError(message);
      }
      // Both an inline indicator and a toast: this is the one failure that
      // must not be missable, and the inline badge alone was.
      toast.error(message, { id: 'player-autosave' });
    }
  }, []);

  // Hand the pending snapshot to the save queue now.
  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const snapshot = pendingRef.current;
    pendingRef.current = null;
    if (!snapshot) return queueRef.current;
    // Start at once when nothing is in flight; otherwise wait for it.
    const idle = queuedRef.current === 0;
    queuedRef.current += 1;
    const run = idle
      ? write(snapshot)
      : queueRef.current.then(() => write(snapshot));
    queueRef.current = run.finally(() => {
      queuedRef.current -= 1;
    });
    return queueRef.current;
  }, [write]);

  useEffect(() => {
    if (!hasChanges || !playerId || !player) return undefined;
    // For one render after a switch, playerId is the new player while the
    // values are still the outgoing one's. Saving that pairing would write one
    // quarterback's grades onto another.
    if (player.id !== playerId) return undefined;

    pendingRef.current = {
      playerId,
      player,
      team,
      traits,
      roles,
      subRoles,
      badges,
      runningProfile,
      overallGrade,
      status,
      blurbs,
    };
    setSaveState('pending');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, AUTOSAVE_DEBOUNCE_MS);
    return undefined;
  }, [
    playerId,
    player,
    team,
    traits,
    roles,
    subRoles,
    badges,
    runningProfile,
    overallGrade,
    status,
    blurbs,
    hasChanges,
    flush,
  ]);

  // Leaving a player, or the page, writes what is still waiting rather than
  // dropping it. Declared after the effect above so the snapshot it flushes is
  // the outgoing player's.
  useEffect(() => () => flush(), [playerId, flush]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { saveState, saveError, saveNow: flush };
};

export default useAutoSavePlayer;
