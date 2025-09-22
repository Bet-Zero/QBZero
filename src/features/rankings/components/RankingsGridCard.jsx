import React from 'react';
import RankingMovementIndicator from '@/components/shared/RankingMovementIndicator';
import {
  getDisplayName,
  getHeadshotSrc,
  getLogoBackgroundStyle,
  getLogoPath,
  getPlayerIdentifier,
  getRankBackgroundStyle,
  getTeamDisplay,
} from '@/features/rankings/utils/rankingTemplateUtils';

const RankingsGridCard = ({
  player,
  rank,
  showLogoBg,
  showMovement = false,
  movementData = {},
}) => {
  const identifier = getPlayerIdentifier(player, rank);
  const name = getDisplayName(player);
  const team = player?.team;
  const logoPath = getLogoPath(team);
  const headshot = getHeadshotSrc(player);
  const logoBackgroundStyle = getLogoBackgroundStyle(team, showLogoBg);
  const rankBackgroundStyle = getRankBackgroundStyle(team);
  const movement = identifier ? movementData?.[identifier] : null;

  return (
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
            e.currentTarget.src = '/assets/headshots/default.png';
          }}
        />
        <div className={`absolute top-2 left-2 ${rankBackgroundStyle}`}>{rank}</div>
      </div>

      <div className="p-3 relative bg-gradient-to-b from-[#1f1f1f] to-[#1a1a1a] border-t border-white/20">
        <div className="text-white font-medium truncate mb-1">{name}</div>
        <div className="flex items-center gap-1.5">
          {logoPath && (
            <div className="w-4 h-4">
              <img
                src={logoPath}
                alt={team}
                className="w-full h-full object-contain"
                loading="eager"
                decoding="async"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <span className="text-white/60 text-sm">{getTeamDisplay(player)}</span>
        </div>

        {showMovement && movement?.moved && (
          <div className="absolute bottom-3 right-3">
            <RankingMovementIndicator movement={movement} showMovement />
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingsGridCard;
