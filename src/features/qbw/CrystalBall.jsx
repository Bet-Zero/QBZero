import React from 'react';
import PlayerHeadshot from '@/components/shared/PlayerHeadshot';

const CrystalBall = ({ qb, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  };

  const ballSize = sizeClasses[size];

  return (
    <div className="relative flex flex-col items-center group">
      {/* Crystal Ball Container */}
      <div className={`${ballSize} relative`}>
        {/* Crystal ball background with gradient and shadow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-200/30 via-purple-200/20 to-pink-200/30 border-2 border-white/40 shadow-2xl backdrop-blur-sm">
          {/* Inner shine effect */}
          <div className="absolute top-2 left-2 w-4 h-4 bg-white/60 rounded-full blur-sm"></div>
          <div className="absolute top-1 left-1 w-2 h-2 bg-white/80 rounded-full"></div>
        </div>
        
        {/* QB Image - faded inside crystal ball */}
        <div className="absolute inset-2 rounded-full overflow-hidden">
          <div className="w-full h-full relative">
            <img
              src={qb.imageUrl}
              alt={qb.name}
              className="w-full h-full object-cover opacity-70 filter grayscale-0"
              onError={(e) => {
                e.target.src = '/assets/headshots/default.png';
              }}
            />
            {/* Overlay for faded effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-pink-500/20 mix-blend-overlay"></div>
          </div>
        </div>

        {/* Crystal ball reflection */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
      </div>

      {/* QB Name Label */}
      <div className="mt-2 text-center">
        <div className="text-sm font-semibold text-white/90">{qb.name}</div>
        <div className="text-xs text-white/60">{qb.predictionText}</div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className={`${ballSize} rounded-full shadow-xl shadow-blue-500/30`}></div>
      </div>
    </div>
  );
};

export default CrystalBall;