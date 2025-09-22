import React from 'react';

const RankingsHeader = ({ title = 'NFL QB RANKINGS', showDate = true, compact = false }) => {
  const updatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (compact) {
    return (
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-2">
          {title}
        </h1>
        {showDate && (
          <div className="text-sm text-white/60 italic">
            {new Date().toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Title line */}
      <h1 className="text-[56px] md:text-[64px] font-black uppercase tracking-[0.04em] leading-none text-white">
        {title}
      </h1>
      {/* Thin underline under title - shortened and aligned with column 1 */}
      <div className="mt-3 h-[2px] w-[28%] bg-white/20"></div>
      {/* Subline */}
      {showDate && (
        <div className="mt-4 text-[16px] md:text-[18px] text-white/70">
          Updated {updatedDate}
        </div>
      )}
    </div>
  );
};

export default RankingsHeader;