import React from 'react';
import { Activity, Archive } from 'lucide-react';
import { ACTIVE, RETIRED, isActive } from '@/constants/playerStatus';

/**
 * Active / retired, as an icon that takes no space in the layout.
 *
 * Retiring a quarterback never removes them from the curated list — they stay
 * rankable for past seasons. This is what keeps them out of the ranker's
 * default pool instead.
 */
const PlayerStatusToggle = ({ status, onChange, className = '' }) => {
  const active = isActive(status);
  const label = active ? 'Active' : 'Retired';

  return (
    <button
      type="button"
      onClick={() => onChange(active ? RETIRED : ACTIVE)}
      title={`${label} — click to mark ${active ? 'retired' : 'active'}`}
      aria-label={`Status: ${label}. Activate to mark ${
        active ? 'retired' : 'active'
      }.`}
      aria-pressed={!active}
      className={`p-1 rounded transition-colors ${
        active
          ? 'text-green-400/70 hover:text-green-300'
          : 'text-amber-400/80 hover:text-amber-300'
      } ${className}`}
    >
      {active ? <Activity size={16} /> : <Archive size={16} />}
    </button>
  );
};

export default PlayerStatusToggle;
