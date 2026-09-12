import { useEffect, useState } from 'react';
import { getPreviousPersonalRanking } from '@/firebase/personalRankingHelpers';
import { calculateRankingMovement } from '@/utils/rankingMovement';

/**
 * How far each quarterback has moved since the previous saved ranking.
 *
 * Both the editor and the public page worked this out for themselves, and both
 * compared against the wrong snapshot: they took `archives[1]`, reasoning that
 * the newest archive "is likely the same as current". It isn't -- saving
 * archives the board it is replacing, so the newest archive *is* the previous
 * version and `archives[1]` is a generation older than that. Every arrow was
 * measuring two saves back.
 *
 * @param {Array} rankings - the board as it currently stands
 * @param {{ enabled?: boolean }} options
 * @returns {Object} movement keyed by quarterback id; empty until it loads
 */
const usePersonalRankingMovement = (rankings, { enabled = true } = {}) => {
  const [previous, setPrevious] = useState(null);
  const [movement, setMovement] = useState({});

  useEffect(() => {
    if (!enabled) {
      setPrevious(null);
      return undefined;
    }

    let cancelled = false;
    getPreviousPersonalRanking()
      .then((archive) => {
        if (!cancelled) setPrevious(archive?.rankings || null);
      })
      .catch((error) => {
        console.error('Could not load the previous ranking:', error);
        if (!cancelled) setPrevious(null);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !previous || !rankings?.length) {
      setMovement({});
      return;
    }
    setMovement(calculateRankingMovement(rankings, previous));
  }, [rankings, previous, enabled]);

  return movement;
};

export default usePersonalRankingMovement;
