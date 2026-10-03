// src/features/tierMaker/TierRow.jsx
import React from 'react';
import TierPlayerTile from '@/features/lists/TierPlayerTile';

const TierRow = ({
  tier,
  players = [],
  screenshotMode,
  canMoveUp,
  canMoveDown,
  movePlayer,
  removePlayer,
  renameTier,
  deleteTier,
}) => (
  <div
    className={`flex items-center gap-2 border border-white/10 rounded-md min-h-[38px] ${
      tier === 'Pool' ? 'bg-neutral-950 mt-0' : 'bg-neutral-800'
    } p-0`}
  >
    <div className="w-[70px] flex-shrink-0 text-sm text-white font-bold flex items-center justify-between px-1">
      {!screenshotMode && tier !== 'Pool' && (
        <button
          onClick={() => renameTier(tier)}
          aria-label={`Rename tier ${tier}`}
          className="text-xs text-white bg-black/40 px-[4px] rounded hover:bg-white/10"
        >
          ✎
        </button>
      )}
      <span className="flex-1 min-w-0 text-center break-words">
        {tier === 'Pool' ? 'Pool' : tier}
      </span>
      {!screenshotMode && tier !== 'Pool' && (
        <button
          onClick={() => deleteTier(tier)}
          aria-label={`Delete tier ${tier}`}
          className="text-xs text-red-300 bg-black/40 px-[4px] rounded hover:bg-red-600"
        >
          🗑
        </button>
      )}
    </div>
    <div className="flex flex-wrap gap-[2px] flex-1">
      {players.map((player) => (
        <div key={player.player_id} className="relative">
          <TierPlayerTile player={player} />
          {!screenshotMode && (
            <div className="absolute top-1 right-1 flex flex-col gap-1">
              {canMoveUp && (
                <button
                  onClick={() => movePlayer(player.player_id, tier, 'up')}
                  aria-label="Move up a tier"
                  className="text-xs text-white bg-black/40 px-[6px] rounded hover:bg-white/10"
                >
                  ↑
                </button>
              )}
              {canMoveDown && (
                <button
                  onClick={() => movePlayer(player.player_id, tier, 'down')}
                  aria-label="Move down a tier"
                  className="text-xs text-white bg-black/40 px-[6px] rounded hover:bg-white/10"
                >
                  ↓
                </button>
              )}
              <button
                onClick={() => removePlayer(player.player_id, tier)}
                aria-label="Remove from board"
                className="text-xs text-red-300 bg-black/40 px-[6px] rounded hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default TierRow;
