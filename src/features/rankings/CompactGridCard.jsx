import React from 'react';
import RankingMovementIndicator from '@/components/shared/RankingMovementIndicator';

// Helper function to get logo path safely
const getLogoPath = (team) => {
  const teamLogoMap = {
    ARI: 'cardinals', ATL: 'falcons', BAL: 'ravens', BUF: 'bills', CAR: 'panthers',
    CHI: 'bears', CIN: 'bengals', CLE: 'browns', DAL: 'cowboys', DEN: 'broncos',
    DET: 'lions', GB: 'packers', HOU: 'texans', IND: 'colts', JAX: 'jaguars',
    KC: 'chiefs', LAC: 'chargers', LAR: 'rams', LAV: 'raiders', LV: 'raiders',
    MIA: 'dolphins', MIN: 'vikings', NE: 'patriots', NO: 'saints', NYG: 'giants',
    NYJ: 'jets', PHI: 'eagles', PIT: 'steelers', SF: '49ers', SEA: 'seahawks',
    TB: 'buccaneers', TEN: 'titans', WAS: 'commanders',
  };
  if (!team) return null;
  const logoId = teamLogoMap[team] || team.toLowerCase();
  return `/assets/logos/${logoId}.svg`;
};

const getHeadshotSrc = (qb) =>
  qb?.headshotUrl ||
  qb?.imageUrl ||
  `/assets/headshots/${qb?.player_id || qb?.id}.png`;

const CompactGridCard = ({
  qb,
  rank,
  showMovement,
  movementData = {},
}) => {
  const logoPath = getLogoPath(qb.team);
  const headshot = getHeadshotSrc(qb);
  const movement = movementData?.[qb.id];

  return (
    <div className="inline-block w-full">
      {/* Compact Card */}
      <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] rounded-md overflow-hidden border border-white/20 transition-all hover:border-white/40 shadow-lg relative">
        <div className="p-3 flex items-center gap-3">
          {/* Rank */}
          <div className="flex-shrink-0 w-8 h-8 bg-neutral-800/80 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">{rank}</span>
          </div>
          
          {/* Headshot */}
          <div className="flex-shrink-0 w-10 h-10">
            <img
              src={headshot}
              alt={qb.name}
              className="w-full h-full object-cover rounded-full border border-white/20"
              loading="eager"
              decoding="async"
              crossOrigin="anonymous"
              onError={(e) => {
                e.target.src = '/assets/headshots/default.png';
              }}
            />
          </div>

          {/* Name and Team */}
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium text-sm truncate">{qb.name}</div>
            <div className="flex items-center gap-1 mt-0.5">
              {logoPath && (
                <div className="w-3 h-3">
                  <img
                    src={logoPath}
                    alt={qb.team}
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
              <span className="text-white/60 text-xs">
                {qb.team?.toUpperCase() || '—'}
              </span>
            </div>
          </div>

          {/* Movement indicator */}
          {showMovement && movement?.moved && (
            <div className="flex-shrink-0">
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

export default CompactGridCard;