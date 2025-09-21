import React from 'react';
import ToggleButton from '@/components/shared/ui/ToggleButton';

const GridStyleToggle = ({ compactGrid, onChange }) => {
  return (
    <div className="flex gap-2">
      <ToggleButton selected={!compactGrid} onClick={() => onChange(false)}>
        Standard Grid
      </ToggleButton>
      <ToggleButton selected={compactGrid} onClick={() => onChange(true)}>
        Compact Grid
      </ToggleButton>
    </div>
  );
};

export default GridStyleToggle;