// ListTierHeader.jsx
// Displays a tier label (e.g. "Tier 1") and wraps a group of ListPlayerRow entries.
import React from 'react';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import RankedListPlayerRow from './ListPlayerRow';

const RankedListTier = ({
  label,
  placeholder,
  headerIndex,
  players,
  playersMap,
  notes,
  showReorder,
  onLabelChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  onNoteChange,
  onMoveToRank,
  orderLength,
  placingBreaks = false,
  onInsertBreak,
}) => {
  return (
    <div className="w-full">
      {headerIndex !== null && (
        <div className="relative w-full max-w-[1100px] mx-auto mb-6">
          {showReorder && (
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-10">
              <button
                onClick={() => onMoveUp(headerIndex)}
                disabled={headerIndex === 0}
                className="text-white/30 hover:text-white disabled:opacity-20"
              >
                <ChevronUp size={16} />
              </button>
              <div className="text-xs font-bold text-white/40">—</div>
              <button
                onClick={() => onMoveDown(headerIndex)}
                disabled={headerIndex === orderLength - 1}
                className="text-white/30 hover:text-white disabled:opacity-20"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 text-left px-4 py-2 bg-white/5 border border-white/10 rounded">
            <input
              type="text"
              value={label}
              placeholder={placeholder}
              onChange={(e) => onLabelChange(headerIndex, e.target.value)}
              className="text-xl font-bold tracking-wide bg-transparent text-white w-full focus:outline-none"
            />
            <button
              onClick={() => onRemove(headerIndex)}
              title="Delete Tier"
              className="text-neutral-800 hover:text-white/70"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {players.map(({ id, index, rankIndex }) => {
        // No gap straight under a tier header: a break there would only
        // make an empty tier.
        const showGap =
          placingBreaks && onInsertBreak && index !== (headerIndex ?? -2) + 1;
        return (
          <React.Fragment key={id}>
            {showGap && <TierBreakGap onClick={() => onInsertBreak(index)} />}
            <RankedListPlayerRow
              playerId={id}
              player={playersMap[id]}
              index={index}
              rank={rankIndex}
              note={notes[id] || ''}
              onNoteChange={onNoteChange}
              onMoveToRank={onMoveToRank}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onRemove={onRemove}
              showReorder={showReorder}
              isFirst={index === 0}
              isLast={index === orderLength - 1}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
};

// A click target between two rows while "Add Tier Breaks" is on.
export const TierBreakGap = ({ onClick }) => (
  <div className="w-full max-w-[1100px] mx-auto -mt-4 mb-2">
    <button
      type="button"
      onClick={onClick}
      className="group w-full flex items-center gap-2 py-1 text-xs text-purple-300/60 hover:text-white"
    >
      <span className="flex-1 border-t border-dashed border-purple-400/30 group-hover:border-purple-300" />
      <span>+ Tier break here</span>
      <span className="flex-1 border-t border-dashed border-purple-400/30 group-hover:border-purple-300" />
    </button>
  </div>
);

export default RankedListTier;
