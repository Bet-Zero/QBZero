// src/components/shared/GridCard.jsx
import React from 'react';
import RankingMovementIndicator from '@/components/shared/RankingMovementIndicator';

// Helper functions (shared across both implementations)
const teamLogoMap = {
  ARI: 'cardinals',
  ATL: 'falcons',
  BAL: 'ravens',
  BUF: 'bills',
  CAR: 'panthers',
  CHI: 'bears',
  CIN: 'bengals',
  CLE: 'browns',
  DAL: 'cowboys',
  DEN: 'broncos',
  DET: 'lions',
  GB: 'packers',
  HOU: 'texans',
  IND: 'colts',
  JAX: 'jaguars',
  KC: 'chiefs',
  LAC: 'chargers',
  LAR: 'rams',
  LAV: 'raiders',
  LV: 'raiders',
  MIA: 'dolphins',
  MIN: 'vikings',
  NE: 'patriots',
  NO: 'saints',
  NYG: 'giants',
  NYJ: 'jets',
  PHI: 'eagles',
  PIT: 'steelers',
  SF: '49ers',
  SEA: 'seahawks',
  TB: 'buccaneers',
  TEN: 'titans',
  WAS: 'commanders',
};

const teamsWithTopLeftLogos = [
  'LV', 'LAV', 'ATL', 'NYG', 'HOU', 'IND', 'CHI', 'ARI',
  'TEN', 'CIN', 'CLE', 'JAX', 'PIT',
];

const getLogoPath = (team) => {
  if (!team) return null;
  const logoId = teamLogoMap[team] || team.toLowerCase();
  return `/assets/logos/${logoId}.svg`;
};

const getHeadshotSrc = (player) =>
  player?.headshotUrl ||
  player?.imageUrl ||
  `/assets/headshots/${player?.player_id || player?.id}.png`;

const getRankBackgroundStyle = (team) => {
  const hasLogoConflict = teamsWithTopLeftLogos.includes(team);
  
  if (hasLogoConflict) {
    return 'bg-neutral-900/80 backdrop-blur-sm text-white font-bold text-2xl px-1.5 py-1 rounded shadow-xl border border-white/20';
  } else {
    return 'bg-neutral-600/50 backdrop-blur-sm text-white font-bold text-2xl px-1.5 py-1 rounded shadow-lg';
  }
};

const getLogoBackgroundStyle = (team, showLogoBg) => {
  if (!showLogoBg) {
    return { backgroundImage: 'none' };
  }

  const logoPath = getLogoPath(team);
  if (!logoPath) {
    return { backgroundImage: 'none' };
  }

  return {
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.15)), url(${logoPath})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  };
};

// Standard Grid Card (QB Rankings style) - uses aspect-square
const StandardGridCard = ({
  player,
  rank,
  showLogoBg,
  showMovement,
  movementData = {},
}) => {
  const logoPath = getLogoPath(player.team);
  const headshot = getHeadshotSrc(player);
  const logoBackgroundStyle = getLogoBackgroundStyle(player.team, showLogoBg);
  const rankBackgroundStyle = getRankBackgroundStyle(player.team);
  const movement = movementData?.[player.id];

  return (
    <div className="inline-block">
      <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] rounded-lg overflow-hidden border border-white/25 transition-all hover:border-white/40 shadow-2xl">
        <div
          className="aspect-square w-full overflow-hidden bg-[#0a0a0a] relative border-b border-white/15"
          style={logoBackgroundStyle}
        >
          <img
            src={headshot}
            alt={player.name || player.display_name}
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
          <div className="text-white font-medium truncate mb-1">
            {player.display_name || player.name}
          </div>
          <div className="flex items-center gap-1.5">
            {logoPath && (
              <div className="w-4 h-4">
                <img
                  src={logoPath}
                  alt={player.team}
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
              {player.team?.toUpperCase() || '—'}
            </span>
          </div>

          {showMovement && movement?.moved && (
            <div className="absolute bottom-3 right-3">
              <RankingMovementIndicator
                movement={movement}
                showMovement={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Connected Grid Card (Ranker Results style) - uses fixed width
const ConnectedGridCard = ({
  player,
  rank,
  showLogoBg,
  showMovement,
  movementData = {},
}) => {
  const logoPath = getLogoPath(player.team);
  const headshot = getHeadshotSrc(player);
  const logoBackgroundStyle = getLogoBackgroundStyle(player.team, showLogoBg);
  const rankBackgroundStyle = getRankBackgroundStyle(player.team);
  const movement = movementData?.[player.id];

  return (
    <div className="w-[180px]">
      <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] rounded-lg overflow-hidden border border-white/25 transition-all hover:border-white/40 shadow-2xl">
        <div
          className="w-[180px] h-[180px] overflow-hidden bg-[#0a0a0a] relative border-b border-white/15"
          style={logoBackgroundStyle}
        >
          <img
            src={headshot}
            alt={player.name || player.display_name}
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

        <div className="p-3 h-[70px] relative bg-gradient-to-b from-[#1f1f1f] to-[#1a1a1a] border-t border-white/20 flex flex-col">
          <div className="text-white font-medium truncate text-sm mb-1 leading-normal overflow-visible">
            {player.display_name || player.name}
          </div>
          <div className="flex items-center gap-1.5 mt-auto">
            {logoPath && (
              <div className="w-4 h-4 flex-shrink-0">
                <img
                  src={logoPath}
                  alt={player.team}
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
            <span className="text-white/60 text-xs truncate">
              {player.team?.toUpperCase() || '—'}
            </span>
          </div>

          {showMovement && movement?.moved && (
            <div className="absolute bottom-3 right-3">
              <RankingMovementIndicator
                movement={movement}
                showMovement={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { StandardGridCard, ConnectedGridCard };