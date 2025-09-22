import React from 'react';
import RankingMovementIndicator from '@/components/shared/RankingMovementIndicator';

const RankingGridCard = ({
  player,
  rank,
  headshotSrc,
  logoPath,
  logoBackgroundStyle,
  rankBackgroundClass,
  showMovement = false,
  movement,
}) => {
  const displayName = player?.display_name || player?.name || '—';
  const teamAbbreviation = player?.team?.toUpperCase() || '—';

  return (
    <div className="inline-block">
      <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] rounded-lg overflow-hidden border border-white/25 transition-all hover:border-white/40 shadow-2xl">
        <div
          className="aspect-square w-full overflow-hidden bg-[#0a0a0a] relative border-b border-white/15"
          style={logoBackgroundStyle}
        >
          <img
            src={headshotSrc}
            alt={displayName}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="eager"
            decoding="async"
            crossOrigin="anonymous"
            onError={(e) => {
              e.target.src = '/assets/headshots/default.png';
            }}
          />
          <div className={`absolute top-2 left-2 ${rankBackgroundClass}`}>{rank}</div>
        </div>

        <div className="p-3 relative bg-gradient-to-b from-[#1f1f1f] to-[#1a1a1a] border-t border-white/20">
          <div className="text-white font-medium truncate mb-1">{displayName}</div>
          <div className="flex items-center gap-1.5">
            {logoPath && (
              <div className="w-4 h-4">
                <img
                  src={logoPath}
                  alt={teamAbbreviation}
                  className="w-full h-full object-contain"
                  loading="eager"
                  decoding="async"
                  crossOrigin="anonymous"
                  onError={(event) => {
                    event.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <span className="text-white/60 text-sm">{teamAbbreviation}</span>
          </div>

          {showMovement && movement?.moved && (
            <div className="absolute bottom-3 right-3">
              <RankingMovementIndicator movement={movement} showMovement />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankingGridCard;
