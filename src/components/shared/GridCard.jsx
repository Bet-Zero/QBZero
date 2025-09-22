import React from 'react';
import RankingMovementIndicator from '@/components/shared/RankingMovementIndicator';

// Mapping team abbreviations to logo file names
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

// Teams whose logos occupy the top-left area and interfere with rank numbers
const teamsWithTopLeftLogos = [
  'LV',
  'LAV', // Raiders
  'ATL', // Falcons
  'NYG', // Giants
  'HOU', // Texans
  'IND', // Colts
  'CHI', // Bears
  'ARI', // Cardinals
  'TEN', // Titans (partial overlap)
  'CIN', // Bengals (partial overlap)
  'CLE', // Browns (partial overlap)
  'JAX', // Jaguars (partial overlap)
  'PIT', // Steelers (partial overlap)
];

// Helper function to get smart rank background styling based on team logo placement
const getRankBackgroundStyle = (team) => {
  const hasLogoConflict = teamsWithTopLeftLogos.includes(team);

  if (hasLogoConflict) {
    // Higher opacity background with stronger shadow for teams with logo conflicts
    return 'bg-neutral-900/80 backdrop-blur-sm text-white font-bold text-2xl px-1.5 py-1 rounded shadow-xl border border-white/20';
  } else {
    // Keep the original subtle styling for teams without conflicts
    return 'bg-neutral-600/50 backdrop-blur-sm text-white font-bold text-2xl px-1.5 py-1 rounded shadow-lg';
  }
};

// Helper function to get logo path safely
const getLogoPath = (team) => {
  if (!team) return null;
  const logoId = teamLogoMap[team] || team.toLowerCase();
  return `/assets/logos/${logoId}.svg`;
};

// Helper function to get background positioning for team logos
const getLogoBackgroundStyle = (team, showLogoBg) => {
  if (!showLogoBg) {
    return { backgroundImage: 'none' };
  }

  const logoPath = getLogoPath(team);
  if (!logoPath) {
    return { backgroundImage: 'none' };
  }

  // Always center logos for consistent appearance
  return {
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.15)), url(${logoPath})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  };
};

const getHeadshotSrc = (player) =>
  player?.headshotUrl ||
  player?.imageUrl ||
  `/assets/headshots/${player?.player_id || player?.id}.png`;

const GridCard = ({
  player,
  rank,
  showLogoBg = true,
  showMovement = false,
  movementData = {},
  width = 180,
}) => {
  const logoPath = getLogoPath(player.team);
  const headshot = getHeadshotSrc(player);
  const logoBackgroundStyle = getLogoBackgroundStyle(player.team, showLogoBg);
  const rankBackgroundStyle = getRankBackgroundStyle(player.team);
  const movement = movementData?.[player.id];
  const displayName = player.display_name || player.name;

  return (
    <div className="inline-block" style={{ width: `${width}px` }}>
      {/* Card */}
      <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] rounded-lg overflow-hidden border border-white/25 transition-all hover:border-white/40 shadow-2xl">
        {/* Headshot Container with overlaid rank */}
        <div
          className="overflow-hidden bg-[#0a0a0a] relative border-b border-white/15"
          style={{
            width: `${width}px`,
            height: `${width}px`,
            ...logoBackgroundStyle,
          }}
        >
          <img
            src={headshot}
            alt={displayName}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="eager"
            decoding="async"
            crossOrigin="anonymous"
            onError={(e) => {
              e.target.src = '/assets/headshots/default.png';
            }}
          />
          {/* Rank overlay in corner */}
          <div className={`absolute top-2 left-2 ${rankBackgroundStyle}`}>
            {rank}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-3 h-[70px] relative bg-gradient-to-b from-[#1f1f1f] to-[#1a1a1a] border-t border-white/20 flex flex-col">
          <div className="text-white font-medium truncate text-sm mb-1 leading-normal overflow-visible">
            {displayName}
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

          {/* Movement indicator positioned absolutely in bottom-right */}
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

export default GridCard;