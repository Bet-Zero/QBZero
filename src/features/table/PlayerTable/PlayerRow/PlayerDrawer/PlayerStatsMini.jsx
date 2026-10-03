import React from 'react';
import { formatQBStat } from '@/utils/formatting/qbStats';

const statLabels = [
  { label: 'CMP', key: 'CMP' },
  { label: 'ATT', key: 'ATT' },
  { label: 'YDS', key: 'YDS' },
  { label: 'TD', key: 'TD' },
  { label: '', key: 'SPACER' },
  { label: 'INT', key: 'INT' },
  { label: 'CMP%', key: 'CMP%' },
  { label: 'RTG', key: 'RTG' },
  { label: 'QBR', key: 'QBR' },
];

const PlayerStatsMini = ({ stats }) => {
  // `stats = {}` as a default misses null, which a record can carry.
  const values = stats || {};
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
                {formatQBStat(values[key], key)}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default PlayerStatsMini;
