import React from 'react';

const formatStat = (stat, isInteger = false, multiply = false) => {
  if (!stat && stat !== 0) return 'N/A';
  const cleanStat = typeof stat === 'string' ? stat.replace('%', '') : stat;
  let parsed = isInteger ? parseInt(cleanStat) : parseFloat(cleanStat);
  if (isNaN(parsed)) return 'N/A';
  if (multiply) parsed *= 100;
  return parsed.toFixed(1);
};

const PlayerStatsTable = ({ player }) => {
  const stats = player.system?.stats || {};
  const gamesPlayed = stats.G ?? player.bio?.['Games Played'] ?? 'N/A';

  return (
    <div className="w-full max-w-[750px] bg-[#1f1f1f] rounded-2xl shadow-lg px-6 pt-[0.5rem] pb-[0.75rem] text-white text-sm font-medium">
      <div className="flex justify-between items-center mb-[0.5rem] font-bold">
        <div className="w-[60px] font-bold whitespace-nowrap">2024-25</div>
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
        <div className="w-[50px] text-center">{formatStat(stats.CMP)}</div>
        <div className="w-[50px] text-center">{formatStat(stats.ATT)}</div>
        <div className="w-[50px] text-center">{formatStat(stats.YDS)}</div>
        <div className="w-[50px] text-center">{formatStat(stats.TD)}</div>
        <div className="h-4 w-[1px] bg-neutral-700" />
        <div className="w-[50px] text-center">{formatStat(stats.INT)}</div>
        <div className="w-[50px] text-center">
          {formatStat(stats['CMP%'], false, true)}
        </div>
        <div className="w-[50px] text-center">
          {formatStat(stats.RTG)}
        </div>
        <div className="w-[50px] text-center">
          {formatStat(stats.QBR)}
        </div>
      </div>
    </div>
  );
};

export default React.memo(PlayerStatsTable);
