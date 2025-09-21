import React from 'react';
import RankingMovementIndicator from '@/components/shared/RankingMovementIndicator';
import {
  getHeadshotSrc,
  getLogoBackgroundStyle,
  getLogoPath,
  getRankBackgroundStyle,
} from '../utils/rankingsGridCard';

const RankingsGridCard = ({
  player,
  rank,
  showLogoBg,
  showMovement = false,
  movementData = {},
}) => {
  const name =
    player?.name ||
    player?.display_name ||
    player?.full_name ||
    player?.player_name;
  const logoPath = getLogoPath(player?.team);
  const headshot = getHeadshotSrc(player);
  const logoBackgroundStyle = getLogoBackgroundStyle(player?.team, showLogoBg);
  const rankBackgroundStyle = getRankBackgroundStyle(player?.team);
  const playerId = player?.id || player?.player_id || player?.name;
  const movement = movementData?.[playerId];

  return (
    <div className="inline-block">
      <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] rounded-lg overflow-hidden border border-white/25 transition-all hover:border-white/40 shadow-2xl">
        <div
          className="aspect-square w-full overflow-hidden bg-[#0a0a0a] relative border-b border-white/15"
          style={logoBackgroundStyle}
        >
          <img
            src={headshot}
            alt={name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="eager"
            decoding="async"
            crossOrigin="anonymous"
            onError={(e) => {
              e.target.src = '/assets/headshots/default.png';
            }}
          />
          <div className={`absolute top-2 left-2 ${rankBackgroundStyle}`}>
            {rank}
          </div>
        </div>

        <div className="p-3 relative bg-gradient-to-b from-[#1f1f1f] to-[#1a1a1a] border-t border-white/20">
          <div className="text-white font-medium mb-1">{name}</div>
          <div className="flex items-center gap-1.5">
            {logoPath && (
              <div className="w-4 h-4">
                <img
                  src={logoPath}
                  alt={player?.team}
                  className="w-full h-full object-contain"
                  loading="eager"
                  decoding="async"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <span className="text-white/60 text-sm">
              {player?.team?.toUpperCase() || '—'}
            </span>
          </div>

          {showMovement && movement?.moved && (
            <div className="absolute bottom-3 right-3">
              <RankingMovementIndicator movement={movement} showMovement={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankingsGridCard;
