import React from 'react';

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
      {/* Complete Crystal Ball Image */}
      <div className={`${ballSize} relative`}>
        <img
          src={qb.imageUrl}
          alt={`${qb.name} Crystal Ball`}
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.src = '/assets/crystal-balls/QBWCrystalBall.png';
          }}
        />
      </div>
    </div>
  );
};

export default CrystalBall;
