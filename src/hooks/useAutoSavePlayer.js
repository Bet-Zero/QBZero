import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { savePlayerData } from '@/firebaseHelpers';

// What a player edit is actually allowed to change, plus the identity fields a
// record needs to be found again.
//
// This used to write the whole normalized player back, which round-tripped
// derived values -- formattedPosition, heightInInches, salaryByYear, the
// lifted stat columns, headshotUrl -- into the stored document, where the next
// normalize pass would recompute them anyway. bio is kept deliberately:
// usePlayerData only merges a document whose bio.Position is 'QB', so a record
// saved without it is silently dropped on reload and the edit looks lost.
const buildPlayerUpdate = ({
  player,
  traits,
  roles,
  subRoles,
  badges,
  runningProfile,
  overallGrade,
  blurbs,
}) => ({
  player_id: player.player_id ?? player.id,
  display_name: player.display_name ?? player.name ?? '',
  bio: player.bio ?? {},
  traits,
  roles,
  subRoles,
  badges,
  runningProfile,
  overall_grade: overallGrade,
  blurbs,
});

const useAutoSavePlayer = ({
  playerId,
  player,
  traits,
  roles,
  subRoles,
  badges,
  runningProfile,
  overallGrade,
  blurbs,
  hasChanges,
  setHasChanges,
}) => {
  useEffect(() => {
    if (!hasChanges || !playerId || !player) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        await savePlayerData(
          playerId,
          buildPlayerUpdate({
            player,
            traits,
            roles,
            subRoles,
            badges,
            runningProfile,
            overallGrade,
            blurbs,
          })
        );
        if (!cancelled) setHasChanges(false);
      } catch (error) {
        // Leave hasChanges set: the edit is unsaved, and saying so beats
        // clearing the flag and letting it disappear on the next reload.
        console.error('Error auto-saving player:', error);
        toast.error(`Could not save: ${error?.message || 'unknown error'}`, {
          id: 'player-autosave-error',
        });
      }
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
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
    blurbs,
    hasChanges,
    setHasChanges,
  ]);
};

export default useAutoSavePlayer;
