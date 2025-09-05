import { useState, useEffect } from 'react';
import { getCurrentPersonalRanking } from '@/firebase/personalRankingHelpers';

/**
 * Custom hook to get a QB's ranking position from personal rankings
 * @param {string} playerId - The player ID to look up
 * @param {string} playerName - The player name to match against
 * @returns {Object} - { rank: number|null, isLoading: boolean, error: string|null }
 */
export const useQBRanking = (playerId, playerName) => {
  const [rank, setRank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRanking = async () => {
      if (!playerId && !playerName) {
        setRank(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const currentRanking = await getCurrentPersonalRanking();

        if (currentRanking?.rankings?.length > 0) {
          // Try to find by player ID first, then by name
          const qbRanking = currentRanking.rankings.find((qb) => {
            if (playerId && qb.id === playerId) return true;
            if (playerName && qb.name === playerName) return true;
            if (playerName && qb.display_name === playerName) return true;

            // Also try matching the player_id format used in quarterbacks.js
            const normalizedPlayerId = playerId
              ?.replace(/[^a-z0-9-]/gi, '')
              .toLowerCase();
            const normalizedQBId = qb.id
              ?.replace(/[^a-z0-9-]/gi, '')
              .toLowerCase();
            if (normalizedPlayerId && normalizedQBId === normalizedPlayerId)
              return true;

            return false;
          });

          if (qbRanking) {
            setRank(qbRanking.rank);
          } else {
            setRank(null);
          }
        } else {
          setRank(null);
        }
      } catch (err) {
        console.error('Error fetching QB ranking:', err);
        setError('Failed to load ranking');
        setRank(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRanking();
  }, [playerId, playerName]);

  return { rank, isLoading, error };
};

export default useQBRanking;
