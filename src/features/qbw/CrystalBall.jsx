import React from 'react';
import { GENERIC_CRYSTAL_BALL } from '@/utils/qbw/shelves';

const CrystalBall = ({ qb, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
    xl: 'w-48 h-48',
  };

  const ballSize = sizeClasses[size];
  // Only the QB-specific artwork has his face in it; the generic ball needs
  // his name written under it.
  const generic = !qb.imageUrl;
  const caption = qb.predictionText
    ? `${qb.name}: ${qb.predictionText}`
    : qb.name;

  return (
    <div className="relative flex flex-col items-center group" title={caption}>
      <div className={`${ballSize} relative`}>
        <img
          src={qb.imageUrl || GENERIC_CRYSTAL_BALL}
          alt={`${qb.name} Crystal Ball`}
          className="w-full h-full object-contain"
          onError={(e) => {
            if (!e.target.src.endsWith(GENERIC_CRYSTAL_BALL))
              e.target.src = GENERIC_CRYSTAL_BALL;
          }}
        />
      </div>
      {generic && (
        <div className="mt-1 text-xs font-medium text-white/80 text-center max-w-[8rem] truncate">
          {qb.name}
        </div>
      )}
    </div>
  );
};

export default CrystalBall;
