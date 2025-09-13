/**
 * Calculate ranking movement for QBs between current and previous rankings
 * @param {Array} currentRankings - Current ranking data with rank property
 * @param {Array} previousRankings - Previous ranking data with rank property
 * @returns {Object} Map of QB ID to movement data { moved, direction, positions, isNew }
 */
export const calculateRankingMovement = (
  currentRankings = [],
  previousRankings = []
) => {
  const movementMap = {};

  // Create lookup maps
  const currentMap = new Map();
  const previousMap = new Map();

  currentRankings.forEach((qb, index) => {
    currentMap.set(qb.id, index + 1); // Use 1-based ranking
  });

  previousRankings.forEach((qb, index) => {
    previousMap.set(qb.id, index + 1); // Use 1-based ranking
  });

  // Calculate movement for each QB in current rankings
  currentRankings.forEach((qb) => {
    const currentRank = currentMap.get(qb.id);
    const previousRank = previousMap.get(qb.id);

    if (!previousRank) {
      // New QB in rankings
      movementMap[qb.id] = {
        moved: false,
        direction: null,
        positions: 0,
        isNew: true,
      };
    } else if (currentRank === previousRank) {
      // No movement
      movementMap[qb.id] = {
        moved: false,
        direction: null,
        positions: 0,
        isNew: false,
      };
    } else {
      // Moved up or down
      const positions = Math.abs(currentRank - previousRank);
      const direction = currentRank < previousRank ? 'up' : 'down';

      movementMap[qb.id] = {
        moved: true,
        direction,
        positions,
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
