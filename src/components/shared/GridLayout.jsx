// src/components/shared/GridLayout.jsx
import React from 'react';
import { StandardGridCard, ConnectedGridCard } from './GridCard';

const GridLayout = ({
  players,
  gridStyle = 'standard',
  showLogoBg = true,
  showMovement = false,
  movementData = {},
  title = 'QB RANKINGS',
  className = '',
}) => {
  const renderPosterHeader = () => {
    const updatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return (
      <div className="mb-6">
        <h1 className="text-[56px] md:text-[64px] font-black uppercase tracking-[0.04em] leading-none text-white">
          {title}
        </h1>
        <div className="mt-3 h-[2px] w-[28%] bg-white/20"></div>
        <div className="mt-4 text-[16px] md:text-[18px] text-white/70">
          Updated {updatedDate}
        </div>
      </div>
    );
  };

  const renderPosterFooter = () => {
    return (
      <div className="pt-8 border-t border-white/25">
        <div className="flex items-center justify-between text-[12px] text-white/55">
          <span>QBZero</span>
          <span></span>
        </div>
      </div>
    );
  };

  const CardComponent = gridStyle === 'standard' ? StandardGridCard : ConnectedGridCard;

  return (
    <div className={`min-h-screen w-full bg-neutral-950 text-white flex items-center justify-center ${className}`}>
      <div className="w-[1400px] px-16 pt-20 pb-12 flex flex-col">
        {renderPosterHeader()}
        
        <div className="mt-6 mb-12 grid grid-cols-6 gap-x-4 gap-y-6 justify-items-center">
          {players.slice(0, 42).map((player, idx) => (
            <CardComponent
              key={player.id || player.player_id || idx}
              player={player}
              rank={idx + 1}
              showLogoBg={showLogoBg}
              showMovement={showMovement}
              movementData={movementData}
            />
          ))}
        </div>

        {renderPosterFooter()}
      </div>
    </div>
  );
};

export default GridLayout;