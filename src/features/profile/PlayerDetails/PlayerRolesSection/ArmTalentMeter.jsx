// components/LayoutPreview/ArmTalentMeter.jsx
import React from 'react';

const ArmTalentMeter = ({ armTalentValue, onChange }) => {
  return (
    <div className="mt-3">
      <div
        role="slider"
        tabIndex={0}
        aria-label="Arm talent"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={armTalentValue}
        className="relative w-full h-5 rounded-full cursor-pointer"
        style={{
          background: 'linear-gradient(to right, #3b82f6, white, #9333ea)',
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const percentage = Math.round((clickX / rect.width) * 100);
          onChange(percentage);
        }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 10 : 1;
          const clamp = (v) => Math.max(0, Math.min(100, v));
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(clamp(armTalentValue + step));
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(clamp(armTalentValue - step));
          } else if (e.key === 'Home') {
            e.preventDefault();
            onChange(0);
          } else if (e.key === 'End') {
            e.preventDefault();
            onChange(100);
          }
        }}
      >
        <div
          className="absolute top-[-6px] w-[6px] h-[31px] bg-white border border-gray-700 rounded-sm"
          style={{ left: `${armTalentValue}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <div className="flex justify-between text-xs text-white font-medium mt-1">
        <span>None</span>
        <span>Elite</span>
      </div>
    </div>
  );
};

export default React.memo(ArmTalentMeter);
