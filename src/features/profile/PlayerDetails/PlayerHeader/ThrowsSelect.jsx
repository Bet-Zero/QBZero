import React from 'react';

/**
 * Which hand the quarterback throws with, stored as bio.Throws ('R' or 'L').
 * Unset until someone picks one, rather than assuming right-handed.
 */
const ThrowsSelect = ({ value, onChange }) => (
  <select
    aria-label="Throws"
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    className="bg-transparent text-white font-thin border-b border-white/30 hover:border-white/60 focus:outline-none cursor-pointer"
  >
    {!value && <option value="">N/A</option>}
    <option value="R" className="bg-[#1f1f1f]">
      Right
    </option>
    <option value="L" className="bg-[#1f1f1f]">
      Left
    </option>
  </select>
);

export default ThrowsSelect;
