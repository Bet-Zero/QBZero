import React from 'react';
import { useQBRanking } from '@/hooks/useQBRanking';

const QBRankingBadge = ({ playerId, playerName }) => {
  const { rank, isLoading, error } = useQBRanking(playerId, playerName);

  // Don't render anything if loading or no ranking found
  if (isLoading || error || !rank) {
    return null;
  }

  // Neutral night mode color scheme with subtle tier differentiation
  const getBadgeColor = (ranking) => {
    if (ranking <= 5) return 'from-slate-600 to-slate-700'; // Elite - Darker slate
    if (ranking <= 12) return 'from-slate-500 to-slate-600'; // Good - Medium slate
    if (ranking <= 20) return 'from-slate-400 to-slate-500'; // Average - Light slate
    if (ranking <= 28) return 'from-gray-500 to-gray-600'; // Below Average - Gray
    return 'from-gray-600 to-gray-700'; // Poor - Darker gray
  };

  const getTextColor = (ranking) => {
    if (ranking <= 5) return 'text-slate-100';
    if (ranking <= 12) return 'text-slate-50';
    if (ranking <= 20) return 'text-white';
    if (ranking <= 28) return 'text-gray-100';
    return 'text-gray-200';
  };

  const getBorderColor = (ranking) => {
    if (ranking <= 5) return 'border-slate-400/30';
    if (ranking <= 12) return 'border-slate-300/30';
    if (ranking <= 20) return 'border-white/30';
    if (ranking <= 28) return 'border-gray-300/30';
    return 'border-gray-400/30';
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          px-3 py-1.5 rounded-lg bg-gradient-to-r ${getBadgeColor(rank)} 
          shadow-lg border ${getBorderColor(rank)} backdrop-blur-sm
        `}
      >
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-white/90">RANK:</span>
          <span className={`text-sm font-bold ${getTextColor(rank)}`}>
            #{rank}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QBRankingBadge;
