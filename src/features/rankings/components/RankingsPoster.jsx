import React from 'react';
import RankingsGridCard from '@/features/rankings/components/RankingsGridCard';
import {
  formatPosterDate,
  getPlayerIdentifier,
} from '@/features/rankings/utils/rankingTemplateUtils';

const RankingsPoster = ({
  players = [],
  showLogoBg = true,
  showMovement = false,
  movementData = {},
  containerRef,
  title = 'NFL QB RANKINGS',
  updatedDate = new Date(),
  footerLeft = 'QBZero',
  limit = 42,
}) => {
  const formattedDate = formatPosterDate(updatedDate);

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white flex items-center justify-center">
      <div ref={containerRef} className="w-[1400px] px-16 pt-20 pb-12 flex flex-col">
        <div className="mb-6">
          <h1 className="text-[56px] md:text-[64px] font-black uppercase tracking-[0.04em] leading-none text-white">
            {title}
          </h1>
          <div className="mt-3 h-[2px] w-[28%] bg-white/20" />
          <div className="mt-4 text-[16px] md:text-[18px] text-white/70">
            Updated {formattedDate}
          </div>
        </div>

        <div className="mt-6 mb-12 grid grid-cols-6 gap-x-4 gap-y-6 justify-items-center">
          {players.slice(0, limit).map((player, index) => (
            <div
              key={getPlayerIdentifier(player, index)}
              className="w-[180px]"
            >
              <RankingsGridCard
                player={player}
                rank={index + 1}
                showLogoBg={showLogoBg}
                showMovement={showMovement}
                movementData={movementData}
              />
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/25">
          <div className="flex items-center justify-between text-[12px] text-white/55">
            <span>{footerLeft}</span>
            <span />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingsPoster;
