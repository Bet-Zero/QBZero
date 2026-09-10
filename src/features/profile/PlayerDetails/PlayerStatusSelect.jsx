import React, { useId } from 'react';
import { ACTIVE, PLAYER_STATUSES } from '@/constants/playerStatus';

/**
 * Marks a quarterback active or retired.
 *
 * Retired quarterbacks are never removed from the curated list — they stay
 * rankable in past-season contexts. This is what keeps them out of the
 * ranker's default pool instead.
 */
const PlayerStatusSelect = ({ status, onChange }) => {
  const selectId = useId();

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={selectId}
        className="text-white/50 text-[11px] uppercase tracking-wide"
      >
        Status
      </label>
      <select
        id={selectId}
        value={status || ACTIVE}
        onChange={(e) => onChange(e.target.value)}
        className="bg-neutral-800 text-white text-xs px-2 py-1 rounded border border-white/10"
      >
        {PLAYER_STATUSES.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PlayerStatusSelect;
