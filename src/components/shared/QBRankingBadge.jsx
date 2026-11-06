import React from 'react';
import { useQBRanking } from '@/hooks/useQBRanking';

// One look for every rank, matching the profile's dark bio box. This used to
// shade by rank tier, which ran light-to-dark-to-light rather than in one
// direction, and the #13-20 tier was too pale for white text (about 2.6:1).
// The number carries the meaning.
const QBRankingBadge = ({ playerId, playerName }) => {
  const { rank, isLoading, error } = useQBRanking(playerId, playerName);

  // Don't render anything if loading or no ranking found
  if (isLoading || error || !rank) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div
        data-testid="qb-ranking-badge"
        className="px-3 py-1.5 rounded-lg bg-[#1f1f1f] border border-white/20 shadow-lg"
      >
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-white/70">RANK:</span>
          <span className="text-sm font-bold text-white">#{rank}</span>
        </div>
      </div>
    </div>
  );
};

export default QBRankingBadge;
