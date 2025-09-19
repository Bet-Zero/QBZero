// TierPlayerTile.jsx
// Small visual player card used in tier layouts (ListTierExport and TierMaker).
import React from 'react';
import { getPlayerPositionLabel } from '@/utils/roles';
import { formatHeight } from '@/utils/formatting';
import TeamLogo from '@/components/shared/TeamLogo';

const TierPlayerTile = ({ player }) => {
  if (!player) return null;

  const headshot =
    player.headshot ||
    player.headshotUrl ||
    `/assets/headshots/${player.player_id}.png`;

  const position = getPlayerPositionLabel(
    player.bio?.Position || player.formattedPosition
  );
  const nameParts = (
    player.display_name ||
    player.name ||
    'Unknown Player'
  ).split(' ');
  const firstName = nameParts[0]?.toUpperCase() || '';
  const lastName = nameParts.slice(1).join(' ').toUpperCase() || '';

  // Special handling for long last names
  const isLongLastName = lastName.length > 8;
  const lastNameFontSize = isLongLastName ? 'text-[9px]' : 'text-[10px]';

  return (
    <div className="relative overflow-visible p-[1px]">
      <div className="relative bg-gradient-to-br from-[#1e1e1e] to-[#111] border border-white/10 rounded-md overflow-hidden shadow-md flex flex-col w-[92px] hover:shadow-xl transition-all duration-200">
        <div className="relative aspect-square">
          <img
            src={headshot}
            alt={player.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/assets/headshots/default.png';
            }}
          />
          <div className="absolute top-0 left-0 px-[4px] py-[1px] bg-black/00 text-white/40 text-[12px] font-semibold uppercase rounded-sm tracking-wider shadow-md">
            {position}
          </div>
        </div>
        <div className="bg-[#0f0f0f] px-[3px] py-[4px] flex items-center justify-between text-white border-t border-white/10 h-[34px]">
          <div className="flex flex-col flex-1 min-w-0">
            <div className="text-[9px] text-white/70 leading-[10px] overflow-hidden whitespace-nowrap">
              {firstName}
            </div>
            <div
              className={`${lastNameFontSize} font-bold text-white leading-[10px] overflow-hidden whitespace-nowrap`}
            >
              {lastName}
            </div>
          </div>
          <div className="flex-shrink-0 ml-1 flex items-center">
            <TeamLogo teamAbbr={player.bio?.Team} className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierPlayerTile;
