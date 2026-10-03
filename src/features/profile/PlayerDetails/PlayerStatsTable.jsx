import React from 'react';
import { formatQBStat } from '@/utils/formatting/qbStats';
import { getCurrentSeasonYear } from '@/utils/contracts';

const formatStat = (stats, key) => formatQBStat(stats[key], key) ?? 'N/A';

const PlayerStatsTable = ({ player }) => {
  const stats = player.system?.stats || {};
  const gamesPlayed = stats.G ?? player.bio?.['Games Played'] ?? 'N/A';

  return (
    <div className="w-full max-w-[750px] bg-[#1f1f1f] rounded-2xl shadow-lg px-6 pt-[0.5rem] pb-[0.75rem] text-white text-sm font-medium">
      <div className="flex justify-between items-center mb-[0.5rem] font-bold">
        {/* The active NFL season, which rolls over with the league year in
            March. This was a hard-coded "2024-25", a basketball-style label. */}
        <div className="w-[60px] font-bold whitespace-nowrap">
          {getCurrentSeasonYear()}
        </div>
        <div className="h-4 w-[1px] bg-neutral-700" />
        <div className="w-[50px] text-center">CMP</div>
        <div className="w-[50px] text-center">ATT</div>
        <div className="w-[50px] text-center">YDS</div>
        <div className="w-[50px] text-center">TD</div>
        <div className="h-4 w-[1px] bg-neutral-700" />
        <div className="w-[50px] text-center">INT</div>
        <div className="w-[50px] text-center">CMP%</div>
        <div className="w-[50px] text-center">RTG</div>
        <div className="w-[50px] text-center">QBR</div>
      </div>
      <div className="h-[1px] bg-neutral-700 mb-[0.5rem]" />
      <div className="flex justify-between items-center font-light">
        <div className="w-[60px] text-center text-neutral-400 font-medium">
          G: {gamesPlayed}
        </div>
        <div className="h-4 w-[1px] bg-neutral-700" />
        <div className="w-[50px] text-center">{formatStat(stats, 'CMP')}</div>
        <div className="w-[50px] text-center">{formatStat(stats, 'ATT')}</div>
        <div className="w-[50px] text-center">{formatStat(stats, 'YDS')}</div>
        <div className="w-[50px] text-center">{formatStat(stats, 'TD')}</div>
        <div className="h-4 w-[1px] bg-neutral-700" />
        <div className="w-[50px] text-center">{formatStat(stats, 'INT')}</div>
        <div className="w-[50px] text-center">{formatStat(stats, 'CMP%')}</div>
        <div className="w-[50px] text-center">{formatStat(stats, 'RTG')}</div>
        <div className="w-[50px] text-center">{formatStat(stats, 'QBR')}</div>
      </div>
    </div>
  );
};

export default React.memo(PlayerStatsTable);
