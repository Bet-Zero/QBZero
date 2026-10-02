import React from 'react';
import { POOL_DEFAULT, POOL_ALL } from '@/utils/ranker/rankerPool';

const OPTIONS = [
  {
    value: POOL_DEFAULT,
    label: 'Default pool',
    detail: 'Every starter, plus the backups that matter',
  },
  {
    value: POOL_ALL,
    label: 'Every active QB',
    detail: 'The full roster, practice squads included',
  },
];

export const PoolSelector = ({ value, counts, onChange }) => (
  <div className="text-white px-4 max-w-[700px] mx-auto mb-2">
    <h3 className="font-semibold mb-3 text-sm sm:text-base text-white/80">
      Who are you ranking?
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`text-left p-4 rounded-lg border transition-colors ${
              selected
                ? 'bg-teal-600/20 border-teal-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{option.label}</span>
              <span className="text-sm text-white/60">
                {counts[option.value]} QBs
              </span>
            </span>
            <span className="block text-xs text-white/50 mt-1">
              {option.detail}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export default PoolSelector;
