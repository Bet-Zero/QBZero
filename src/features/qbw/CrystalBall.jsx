import React from 'react';
import PlayerHeadshot from '@/components/shared/PlayerHeadshot';

const CrystalBall = ({ qb, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
    xl: 'w-48 h-48',
  };

  const ballSize = sizeClasses[size];

  return (
    <div className="relative flex flex-col items-center group">
      {/* Crystal Ball Container - Using your actual PNG */}
      <div className={`${ballSize} relative`}>
        <img
          src="/assets/crystal-balls/QBWCrystalBall.png"
          alt="Crystal Ball"
          className="w-full h-full object-contain"
        />

        {/* QB Image inside the crystal ball */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1/2 h-1/2 rounded-full overflow-hidden">
            <img
              src={qb.imageUrl}
              alt={qb.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/assets/headshots/default.png';
              }}
            />
          </div>
        </div>
      </div>

      {/* QB Name Label */}
      <div className="mt-3 text-center">
        <div className="text-base font-semibold text-white/90">{qb.name}</div>
        <div className="text-sm text-white/60">{qb.predictionText}</div>
      </div>
    </div>
  );
};

export default CrystalBall;
