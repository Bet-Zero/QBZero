// src/features/tierMaker/TierRow.jsx
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TierPlayerTile from '@/features/lists/TierPlayerTile';
import { POOL } from '@/utils/tierMaker/tierBoard';

export const tierDragId = (tier) => `tier:${tier}`;
export const rowDropId = (tier) => `row:${tier}`;

const SortablePlayer = ({
  player,
  tier,
  screenshotMode,
  canMoveUp,
  canMoveDown,
  movePlayer,
  removePlayer,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: player.player_id,
    data: { type: 'player', tier },
    disabled: screenshotMode,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative ${isDragging ? 'opacity-30' : ''}`}
    >
      {/* Drag listeners sit on the tile only, so the buttons stay clickable
          and Enter on a button doesn't pick the tile up. */}
      <div
        {...attributes}
        {...listeners}
        aria-label={`Drag ${player.display_name || player.name || 'player'}`}
        className={screenshotMode ? '' : 'cursor-grab active:cursor-grabbing'}
      >
        <TierPlayerTile player={player} />
      </div>
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
  );
};

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
}) => {
  const isPool = tier === POOL;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tierDragId(tier),
    data: { type: 'tier', tier },
    disabled: isPool || screenshotMode,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: rowDropId(tier),
    data: { type: 'row', tier },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex items-center gap-2 border rounded-md min-h-[38px] p-0 ${
        isPool ? 'bg-neutral-950 mt-0' : 'bg-neutral-800'
      } ${isOver ? 'border-white/40' : 'border-white/10'} ${
        isDragging ? 'relative z-10 opacity-80 shadow-xl' : ''
      }`}
    >
      <div className="w-[70px] flex-shrink-0 text-sm text-white font-bold flex items-center justify-between px-1 self-stretch">
        {!screenshotMode && !isPool && (
          <button
            onClick={() => renameTier(tier)}
            aria-label={`Rename tier ${tier}`}
            className="text-xs text-white bg-black/40 px-[4px] rounded hover:bg-white/10"
          >
            ✎
          </button>
        )}
        <span
          ref={setActivatorNodeRef}
          {...(isPool || screenshotMode ? {} : { ...attributes, ...listeners })}
          aria-label={
            isPool || screenshotMode ? undefined : `Drag tier ${tier}`
          }
          title={isPool || screenshotMode ? undefined : 'Drag to reorder tier'}
          className={`flex-1 min-w-0 text-center break-words self-stretch flex items-center justify-center ${
            isPool || screenshotMode ? '' : 'cursor-grab active:cursor-grabbing'
          }`}
        >
          {tier}
        </span>
        {!screenshotMode && !isPool && (
          <button
            onClick={() => deleteTier(tier)}
            aria-label={`Delete tier ${tier}`}
            className="text-xs text-red-300 bg-black/40 px-[4px] rounded hover:bg-red-600"
          >
            🗑
          </button>
        )}
      </div>
      <SortableContext
        items={players.map((p) => p.player_id)}
        strategy={rectSortingStrategy}
      >
        <div
          ref={setDropRef}
          className="flex flex-wrap gap-[2px] flex-1 self-stretch min-h-[38px]"
        >
          {players.map((player) => (
            <SortablePlayer
              key={player.player_id}
              player={player}
              tier={tier}
              screenshotMode={screenshotMode}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              movePlayer={movePlayer}
              removePlayer={removePlayer}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default TierRow;
