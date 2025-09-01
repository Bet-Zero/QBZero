import { useEffect } from 'react';
import { savePlayerData } from '@/firebaseHelpers';

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

    const timer = setTimeout(async () => {
      try {
        await savePlayerData(playerId, {
          ...player,
          traits,
          roles,
          subRoles,
          badges,
          runningProfile,
          overall_grade: overallGrade,
          blurbs,
        });
        setHasChanges(false);
      } catch (error) {
        console.error('Error auto-saving player:', error);
      }
    }, 1500);

    return () => clearTimeout(timer);
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
