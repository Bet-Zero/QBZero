import React from 'react';
import QBRankingCard from '@/features/rankings/QBRankingCard';
import {
  getDisplayName,
  getHeadshotSrc,
  getPlayerIdentifier,
  getTeamDisplay,
} from '@/features/rankings/utils/rankingTemplateUtils';

const RankingsBoardView = ({
  players = [],
  title = 'Official QB Rankings',
  subtitle = 'The definitive quarterback rankings, updated regularly.',
  updatedDate = new Date(),
  emptyStateMessage = 'No rankings available yet.',
  wrapperClassName = '',
  showUpdatedDate = true,
}) => {
  const formattedPlayers = players.map((player, index) => {
    const identifier = getPlayerIdentifier(player, index);

    return {
      ...player,
      id: player?.id || player?.player_id || identifier || `player-${index}`,
      name: getDisplayName(player),
      team: getTeamDisplay(player),
      imageUrl: getHeadshotSrc(player),
      rank: index + 1,
    };
  });

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${wrapperClassName}`}>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-3">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/60 text-lg">{subtitle}</p>
        )}
        {showUpdatedDate && (
          <div className="mt-2 text-sm text-white/40">
            Last updated: {new Date(updatedDate).toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {formattedPlayers.map((qb) => (
          <QBRankingCard
            key={`${qb.id}-${qb.rank}`}
            qb={qb}
            readOnly={true}
            canMoveUp={false}
            canMoveDown={false}
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            onRemove={() => {}}
            onEditNotes={() => {}}
          />
        ))}

        {formattedPlayers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/40 text-lg">{emptyStateMessage}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingsBoardView;
