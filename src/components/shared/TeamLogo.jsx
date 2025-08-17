import React from 'react';
import { getTeamLogoFilename } from '@/utils/formatting';

const TeamLogo = ({ teamAbbr, teamId, className = '' }) => {
  const key = teamId || teamAbbr;
  const fileName = getTeamLogoFilename(key);
  const teamLogo = `/assets/logos/${fileName}.svg`;
  const fallbackPath = '/assets/logos/nfl.svg'; // Updated fallback to match existing file
  const sizeClasses = className || 'w-[3.5rem] h-[3.5rem]';

  return (
    <div
      className={`relative ${sizeClasses}`}
      style={{
        backgroundImage: `url(${teamLogo})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    />
  );
};

export default TeamLogo;
