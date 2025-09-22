import React from 'react';
import GridCard from './GridCard';
import RankingsHeader from './RankingsHeader';
import RankingsFooter from './RankingsFooter';

const QBRankingsGridLayout = ({
  players = [],
  title = 'QB RANKINGS',
  showLogoBg = true,
  showMovement = false,
  movementData = {},
  containerRef,
  maxItems = 42,
  showFooter = true,
}) => {
  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white flex items-center justify-center">
      <div
        ref={containerRef}
        className="w-[1400px] px-16 pt-20 pb-12 flex flex-col"
      >
        {/* Header */}
        <RankingsHeader title={title} showDate={true} />

        {/* Grid with 6 columns x 7 rows - matching QB Rankings format */}
        <div className="mt-6 mb-12 grid grid-cols-6 gap-x-4 gap-y-6 justify-items-center">
          {players.slice(0, maxItems).map((player, idx) => (
            <GridCard
              key={player.id || player.player_id || idx}
              player={player}
              rank={idx + 1}
              showLogoBg={showLogoBg}
              showMovement={showMovement}
              movementData={movementData}
              width={180}
            />
          ))}
        </div>

        {/* Footer */}
        {showFooter && <RankingsFooter />}
      </div>
    </div>
  );
};

export default QBRankingsGridLayout;