import React from 'react';

const statLabels = [
  { label: 'CMP', key: 'CMP' },
  { label: 'ATT', key: 'ATT' },
  { label: 'YDS', key: 'YDS' },
  { label: 'TD', key: 'TD' },
  { label: '', key: 'SPACER' },
  { label: 'CMP%', key: 'CMP%' },
  { label: 'RTG', key: 'RTG' },
  { label: 'QBR', key: 'QBR' },
];

const formatStat = (value, key) => {
  if (value === undefined || value === null || key === 'SPACER') return null;
  if (key === 'CMP%' && typeof value === 'number' && value < 1) {
    return (value * 100).toFixed(1);
  }
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === 'number') {
    return value.toFixed(1);
  }
  return value;
};

const PlayerStatsMini = ({ stats = {} }) => {
  return (
    <div className="w-[112px] bg-[#1f1f1f] ml-0 rounded-md p-2 shadow-sm">
      <div className="text-[11px] font-semibold mb-1.5">Stats</div>
      <div className="flex flex-col gap-1">
        {statLabels.map(({ label, key }) =>
          key === 'SPACER' ? (
            <div key="spacer" className="h-2" />
          ) : (
            <div key={key} className="flex justify-between text-[11px]">
              <span className="text-white/50">{label}</span>
              <span className="text-white/90">
                {formatStat(stats[key], key)}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default PlayerStatsMini;
