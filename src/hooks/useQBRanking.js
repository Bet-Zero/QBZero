import { useEffect, useState } from 'react';
import { getCurrentPersonalRanking } from '@/firebase/personalRankingHelpers';

/**
 * Where a quarterback sits on the personal rankings board, for the badge on his
 * profile.
 *
 * Matching used to try the id, then the name, then the id again with
 * punctuation stripped -- because board entries carried a generated id that
 * could never match a player document, so only the name lookup ever fired and
 * the rest was dead weight. Entries keep their roster id now, which is the
 * player document id, so the id is the match and the name is the fallback for
 * boards saved before that change.
 *
 * @param {string} playerId
 * @param {string} playerName
 * @returns {{ rank: number|null, isLoading: boolean, error: string|null }}
 */
export const useQBRanking = (playerId, playerName) => {
  const [rank, setRank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!playerId && !playerName) {
      setRank(null);
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);

    getCurrentPersonalRanking()
      .then((currentRanking) => {
        if (cancelled) return;

        const entries = currentRanking?.rankings || [];
        const match =
          entries.find((qb) => playerId && qb.id === playerId) ||
          entries.find(
            (qb) =>
              playerName &&
              (qb.name === playerName || qb.display_name === playerName)
          );

        // Position in the board is the rank; the stored `rank` field is only a
        // copy of it, and the two used to drift.
        const index = match ? entries.indexOf(match) : -1;
        setRank(index >= 0 ? index + 1 : null);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Error fetching QB ranking:', err);
        setError('Failed to load ranking');
        setRank(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [playerId, playerName]);

  return { rank, isLoading, error };
};

export default useQBRanking;
