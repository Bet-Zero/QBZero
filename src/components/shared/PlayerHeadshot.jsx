import React from 'react';

const PlayerHeadshot = ({ src, playerId, className = '' }) => {
  const initialSrc = src || `/assets/headshots/${playerId}.png`;

  const handleError = (e) => {
    if (!playerId) {
      e.target.src = '/assets/headshots/default.png';
      return;
    }
    e.target.src = '/assets/headshots/default.png';
  };

  // Default size if no className provided
  const defaultClasses = className || 'w-[200px] h-[200px]';

  return (
    <div
      className={`${defaultClasses} rounded-xl overflow-hidden border-2 border-black`}
    >
      <img
        src={initialSrc}
        onError={handleError}
        alt="Player headshot"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default PlayerHeadshot;
