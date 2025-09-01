import React from 'react';

const RUNNING_TIERS = {
  Elite: 'text-green-500 border-green-500',
  Plus: 'text-lime-400 border-lime-400',
  Capable: 'text-yellow-400 border-yellow-400',
  Willing: 'text-orange-400 border-orange-400',
  Hesitant: 'text-orange-600 border-orange-600',
  Non: 'text-red-600 border-red-600',
};

const RunningProfileMini = ({ value = '' }) => {
  const cleaned = value?.replace('Runner', '').trim();
  const label = cleaned || '—';
  const isEmpty = label === '—';

  const style = isEmpty
    ? 'text-white/30 border-white/20'
    : RUNNING_TIERS[cleaned] || 'text-white border-white';

  return (
    <div className="relative flex items-center justify-center">
      {/* Badge */}
      <div
        className={`w-[70px] py-1 rounded-md border text-xs font-medium text-center tracking-wide ${style}`}
      >
        {label.toUpperCase()}
      </div>

      {/* Floating Label */}
      <span className="absolute -top-4 text-[9px] text-gray-400 uppercase tracking-wide">
        Running
      </span>
    </div>
  );
};

export default RunningProfileMini;
