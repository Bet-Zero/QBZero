// ListPlayerRow.jsx
// Full player row component for ranked or tiered lists. Rank display is now optional via showRank prop.

import React from 'react';
import PlayerRow from '@/features/table/PlayerTable/PlayerRow';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { POSITION_MAP } from '@/utils/roles';

const ListPlayerRow = ({
  player,
  playerId,
  index, // order index used for reordering
  rank,
  onMoveUp,
  onMoveDown,
  onRemove,
  showReorder = true,
  showRank = true, // 🔁 new toggle for rank display
  isFirst = index === 0,
  isLast = false,
}) => {
  // A saved id that no longer matches anyone on the roster. Shown so it can
  // be removed, rather than hidden (where it was unreachable) or crashing.
  if (!player) {
    return (
      <div className="relative w-full max-w-[1100px] mx-auto mb-6">
        <div className="flex items-center justify-between h-[48px] px-4 bg-[#1e1e1e]/60 border border-dashed border-white/15 rounded-sm text-sm text-white/50">
          <span>
            Player not found on the roster
            {playerId ? (
              <span className="text-white/30"> ({playerId})</span>
            ) : null}
          </span>
          <button
            onClick={() => onRemove(index)}
            title="Remove from List"
            className="text-white/40 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  const processedPlayer = {
    ...player,
    id: player.player_id,
    formattedPosition:
      player.formattedPosition || POSITION_MAP[player.bio?.Position] || '—',
    headshotUrl:
      player.headshotUrl || `/assets/headshots/${player.player_id}.png`,
    offenseRole: player.roles?.offense1 || player.offenseRole || '—',
    runningProfile: player.runningProfile || '—',
  };

  return (
    <div className="relative w-full max-w-[1100px] mx-auto mb-6">
      {/* Arrows & Rank */}
      {(showReorder || showRank) && (
        <div className="absolute -left-5 top-[45px] -translate-y-1/2 flex flex-col items-center justify-center z-10">
          {showReorder && (
            <button
              onClick={() => onMoveUp(index)}
              disabled={isFirst}
              className="text-white/30 hover:text-white disabled:opacity-20"
            >
              <ChevronUp size={16} />
            </button>
          )}

          {showRank && (
            <div className="text-xs font-bold text-white/40">
              {(rank ?? index) + 1}
            </div>
          )}

          {showReorder && (
            <button
              onClick={() => onMoveDown(index)}
              disabled={isLast}
              className="text-white/30 hover:text-white disabled:opacity-20"
            >
              <ChevronDown size={16} />
            </button>
          )}
        </div>
      )}

      {/* X button – top-left */}
      {showReorder && (
        <div className="absolute top-0 left-0.5 z-10">
          <button
            onClick={() => onRemove(index)}
            title="Remove from List"
            className="text-[#1e1e1e] hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Player Row */}
      <PlayerRow player={processedPlayer} />

      {/* Optional Notes */}
      {/*
      <textarea
        value={note || ''}
        onChange={(e) => onNoteChange(player.id, e.target.value)}
        placeholder="Optional notes..."
        className="w-full mt-1 text-sm bg-neutral-800 text-white p-2 rounded border border-white/10 resize-none"
      />
      */}

      {/* Divider */}
      <div className="w-full h-[2px] bg-purple-800/30 rounded mt-3" />
    </div>
  );
};

export default ListPlayerRow;
