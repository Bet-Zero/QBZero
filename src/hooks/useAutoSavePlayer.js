import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { savePlayerData } from '@/firebaseHelpers';

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
const buildPlayerUpdate = ({
  player,
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
    bio: player.bio ?? {},
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
 */
const useAutoSavePlayer = ({
  playerId,
  player,
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
}) => {
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState(null);

  // The debounce fires later, so read the values from a ref rather than
  // closing over whatever they were when the timer was set.
  const snapshotRef = useRef(null);
  snapshotRef.current = {
    playerId,
    player,
    traits,
    roles,
    subRoles,
    badges,
    runningProfile,
    overallGrade,
    status,
    blurbs,
  };

  const timerRef = useRef(null);
  const savingRef = useRef(false);

  const save = useCallback(async () => {
    const snapshot = snapshotRef.current;
    if (!snapshot?.playerId || !snapshot.player || savingRef.current) return;

    savingRef.current = true;
    setSaveState('saving');
    setSaveError(null);

    try {
      await savePlayerData(snapshot.playerId, buildPlayerUpdate(snapshot));
      setSaveState('saved');
      setSaveError(null);
      setHasChanges(false);
    } catch (error) {
      // Leave hasChanges set: the edit is unsaved, and saying so beats
      // clearing the flag and letting it disappear on the next reload.
      console.error('Error auto-saving player:', error);

      // A rules rejection means the account writing this is not an admin --
      // usually not signed in at all. Say that, rather than quoting Firebase.
      const denied =
        error?.code === 'permission-denied' ||
        /insufficient permissions/i.test(error?.message || '');
      const message = denied
        ? 'Not saved: you are not signed in as an admin.'
        : `Not saved: ${error?.message || 'unknown error'}`;

      setSaveState('error');
      setSaveError(message);
      // Both an inline indicator and a toast: this is the one failure that
      // must not be missable, and the inline badge alone was.
      toast.error(message, { id: 'player-autosave-error' });
    } finally {
      savingRef.current = false;
    }
  }, [setHasChanges]);

  useEffect(() => {
    if (!hasChanges || !playerId || !player) return undefined;

    setSaveState('pending');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    playerId,
    player,
    traits,
    roles,
    subRoles,
    badges,
    runningProfile,
    overallGrade,
    status,
    blurbs,
    hasChanges,
    save,
  ]);

  return { saveState, saveError, saveNow: save };
};

export default useAutoSavePlayer;
