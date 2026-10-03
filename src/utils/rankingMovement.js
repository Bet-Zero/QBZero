const nameKey = (qb) =>
  (qb?.name || qb?.display_name || '').trim().toLowerCase();

/**
 * Pair each quarterback on the newer board with his place on the older one.
 *
 * Id first. Name second, for boards saved before entries kept their roster id:
 * those carried a generated `qb-<timestamp>` id that changed whenever a
 * quarterback was removed and re-added, so comparing against an archive from
 * that era flagged half the board NEW. A name only matches an older entry that
 * no id already claimed, so two different players are never paired.
 *
 * @returns {{ previousRank: Map<string, number>, matched: Set<number> }}
 *   previous 1-based rank keyed by the newer board's id, and the indexes of
 *   older entries that found a partner
 */
export const matchRankings = (currentRankings = [], previousRankings = []) => {
  const previousRank = new Map();
  const matched = new Set();

  const indexById = new Map();
  previousRankings.forEach((qb, index) => {
    if (qb?.id != null && !indexById.has(qb.id)) indexById.set(qb.id, index);
  });

  const unmatched = [];
  currentRankings.forEach((qb) => {
    const index = indexById.get(qb.id);
    if (index === undefined || matched.has(index)) {
      unmatched.push(qb);
      return;
    }
    matched.add(index);
    previousRank.set(qb.id, index + 1);
  });

  if (unmatched.length) {
    const indexByName = new Map();
    previousRankings.forEach((qb, index) => {
      const key = nameKey(qb);
      if (key && !matched.has(index) && !indexByName.has(key)) {
        indexByName.set(key, index);
      }
    });
    unmatched.forEach((qb) => {
      const key = nameKey(qb);
      const index = key ? indexByName.get(key) : undefined;
      if (index === undefined || matched.has(index)) return;
      matched.add(index);
      previousRank.set(qb.id, index + 1);
    });
  }

  return { previousRank, matched };
};

/**
 * Calculate ranking movement for QBs between current and previous rankings.
 * Rank is position in the array, 1-based; the stored `rank` field is a copy.
 * @param {Array} currentRankings
 * @param {Array} previousRankings
 * @returns {Object} Map of QB ID to movement data { moved, direction, positions, isNew }
 */
export const calculateRankingMovement = (
  currentRankings = [],
  previousRankings = []
) => {
  const movementMap = {};
  const { previousRank } = matchRankings(currentRankings, previousRankings);

  currentRankings.forEach((qb, index) => {
    const currentRank = index + 1;
    const previous = previousRank.get(qb.id);

    if (!previous) {
      movementMap[qb.id] = {
        moved: false,
        direction: null,
        positions: 0,
        isNew: true,
      };
    } else if (currentRank === previous) {
      movementMap[qb.id] = {
        moved: false,
        direction: null,
        positions: 0,
        isNew: false,
      };
    } else {
      movementMap[qb.id] = {
        moved: true,
        direction: currentRank < previous ? 'up' : 'down',
        positions: Math.abs(currentRank - previous),
        isNew: false,
      };
    }
  });

  return movementMap;
};

/**
 * Get movement indicator data for a specific QB
 * @param {string} qbId - QB ID to get movement for
 * @param {Object} movementMap - Movement map from calculateRankingMovement
 * @returns {Object|null} Movement data or null if no data
 */
export const getQBMovement = (qbId, movementMap) => {
  return movementMap[qbId] || null;
};
