// ListControls.jsx
// Control bar for list editing – includes save button, divider insert, and toggle UI.
import React from 'react';
import { SplitSquareVertical } from 'lucide-react';

const ListControls = ({
  showReorder,
  onToggleReorder,
  placingBreaks = false,
  onTogglePlacingBreaks,
  onSave,
  isSaving,
  isDirty = false,
  isRanked = true,
}) => (
  <>
    <div className="w-full max-w-[1100px] mx-auto px-4 mt-4 flex justify-start gap-2">
      <button
        onClick={onToggleReorder}
        className="text-xs text-white/40 hover:text-white px-2 py-1 rounded border border-white/10"
      >
        {showReorder ? 'View Mode' : 'Edit Mode'}
      </button>

      <button
        onClick={onTogglePlacingBreaks}
        disabled={!isRanked || !showReorder}
        aria-pressed={placingBreaks}
        title={
          isRanked
            ? 'Click between players to add tier breaks'
            : 'Switch to Ranked to add tier breaks'
        }
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition disabled:opacity-30 ${
          placingBreaks
            ? 'border-purple-400 text-white bg-purple-500/20'
            : 'border-white/10 text-white/40 hover:text-white'
        }`}
      >
        <SplitSquareVertical size={14} />
        {placingBreaks ? 'Done Adding Tiers' : 'Add Tier Breaks'}
      </button>
    </div>

    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={onSave}
        disabled={isSaving}
        className="bg-black/20 text-white px-4 py-2 rounded hover:bg-white/20 transition disabled:opacity-40"
      >
        {isSaving ? 'Saving...' : isDirty ? 'Save List •' : 'Save List'}
      </button>
    </div>
  </>
);

export default ListControls;
