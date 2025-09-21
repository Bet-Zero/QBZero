// src/components/shared/GridStyleToggle.jsx
import React from 'react';
import { Grid3x3, LayoutGrid } from 'lucide-react';

const GridStyleToggle = ({ gridStyle, onChange }) => {
  return (
    <div className="flex gap-1 bg-white/5 rounded-lg p-1">
      <button
        onClick={() => onChange('standard')}
        className={`px-3 py-2 text-sm text-white rounded flex items-center transition-colors ${
          gridStyle === 'standard' 
            ? 'bg-white/20 text-white' 
            : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
        }`}
        title="Standard Grid Style"
      >
        <Grid3x3 size={16} className="mr-1" />
        <span className="hidden sm:inline">Standard</span>
      </button>
      <button
        onClick={() => onChange('connected')}
        className={`px-3 py-2 text-sm text-white rounded flex items-center transition-colors ${
          gridStyle === 'connected' 
            ? 'bg-white/20 text-white' 
            : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
        }`}
        title="Connected Grid Style"
      >
        <LayoutGrid size={16} className="mr-1" />
        <span className="hidden sm:inline">Connected</span>
      </button>
    </div>
  );
};

export default GridStyleToggle;