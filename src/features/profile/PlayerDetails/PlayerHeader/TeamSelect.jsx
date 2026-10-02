import React from 'react';
import { TeamListFull } from '@/constants/teamList';

const TEAM_ABBRS = TeamListFull.map((t) => t.abbr).sort();

/**
 * The quarterback's current team, editable in place for a mid-season move.
 *
 * Without this, correcting a team meant editing quarterbacks.js and running
 * populateQBs, which needs a service-account key.
 */
const TeamSelect = ({ value, onChange }) => (
  <select
    aria-label="Team"
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    className="bg-transparent text-white font-thin border-b border-white/30 hover:border-white/60 focus:outline-none cursor-pointer"
  >
    {!value && <option value="">N/A</option>}
    {TEAM_ABBRS.map((abbr) => (
      <option key={abbr} value={abbr} className="bg-[#1f1f1f]">
        {abbr}
      </option>
    ))}
  </select>
);

export default TeamSelect;
