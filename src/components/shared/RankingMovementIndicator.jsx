import React from 'react';
import { TrendingUp, TrendingDown, Plus } from 'lucide-react';

/**
 * RankingMovementIndicator - Shows movement arrows and position changes for QB rankings
 * @param {Object} movement - Movement data { moved, direction, positions, isNew }
 * @param {boolean} showMovement - Whether to show movement indicators (toggle)
 */
const RankingMovementIndicator = ({ movement, showMovement = true }) => {
  if (!showMovement || !movement) {
    return null;
  }

  // New QB indicator
  if (movement.isNew) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 border border-blue-400/30 rounded-md">
        <Plus size={12} className="text-blue-400" />
        <span className="text-xs font-medium text-blue-300">NEW</span>
      </div>
    );
  }

  // No movement
  if (!movement.moved) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-600/20 border border-gray-400/30 rounded-md">
        <div className="w-3 h-3 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
        </div>
        <span className="text-xs font-medium text-gray-400">—</span>
      </div>
    );
  }

  // Movement up or down
  const isUp = movement.direction === 'up';
  const baseClasses = 'flex items-center gap-1 px-2 py-1 border rounded-md';
  const colorClasses = isUp
    ? 'bg-green-600/20 border-green-400/30'
    : 'bg-red-600/20 border-red-400/30';
  const iconColor = isUp ? 'text-green-400' : 'text-red-400';
  const textColor = isUp ? 'text-green-300' : 'text-red-300';

  return (
    <div className={`${baseClasses} ${colorClasses}`}>
      {isUp ? (
        <TrendingUp size={12} className={iconColor} />
      ) : (
        <TrendingDown size={12} className={iconColor} />
      )}
      <span className={`text-xs font-medium ${textColor}`}>
        {movement.positions}
      </span>
    </div>
  );
};

export default RankingMovementIndicator;
