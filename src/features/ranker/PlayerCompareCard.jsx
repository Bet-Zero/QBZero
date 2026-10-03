import React, { useEffect } from 'react';
import PlayerHeadshot from '@/components/shared/PlayerHeadshot';
import PlayerNameMini from '@/features/table/PlayerTable/PlayerRow/PlayerNameMini';
import '@/features/ranker/ranker.css';

// Keys that should never be read as a shortcut: the user is typing.
const isTypingTarget = (el) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

const PlayerCompareCard = ({ left, right, onSelect, onSkip, onUndo }) => {
  // ← and → pick a side, S skips, Z or Backspace undoes. A held key repeats,
  // and each repeat would answer a different matchup, so repeats are ignored.
  useEffect(() => {
    if (!left || !right) return undefined;
    const handleKey = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === 'arrowleft') onSelect(left, right);
      else if (key === 'arrowright') onSelect(right, left);
      else if (key === 's' && onSkip) onSkip();
      else if ((key === 'z' || key === 'backspace') && onUndo) onUndo();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [left, right, onSelect, onSkip, onUndo]);

  if (!left || !right) return null;

  return (
    <div className="flex flex-col items-center px-4">
      <div className="flex items-center gap-4 sm:gap-8 w-full justify-center">
        <button
          className="compare-button flex flex-col items-center p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => onSelect(left, right)}
        >
          <PlayerHeadshot
            playerId={left.id}
            className="w-[120px] h-[120px] sm:w-[200px] sm:h-[200px]"
          />
          <div className="mt-2 w-[120px] sm:w-[140px]">
            <PlayerNameMini
              name={left.display_name || left.name}
              scale={0.85}
              width={120}
            />
          </div>
        </button>
        <span className="text-lg sm:text-xl font-bold text-white px-2">vs</span>
        <button
          className="compare-button flex flex-col items-center p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => onSelect(right, left)}
        >
          <PlayerHeadshot
            playerId={right.id}
            className="w-[120px] h-[120px] sm:w-[200px] sm:h-[200px]"
          />
          <div className="mt-2 w-[120px] sm:w-[140px]">
            <PlayerNameMini
              name={right.display_name || right.name}
              scale={0.85}
              width={120}
            />
          </div>
        </button>
      </div>
      <div className="flex gap-6 sm:gap-4 mt-6 text-sm text-white/70">
        {onSkip && (
          <button
            onClick={onSkip}
            className="hover:text-white px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
          >
            Skip
          </button>
        )}
        {onUndo && (
          <button
            onClick={onUndo}
            className="hover:text-white px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
          >
            Undo
          </button>
        )}
      </div>
      <p className="hidden sm:block mt-3 text-xs text-white/40">
        ← → to pick · S to skip · Z to undo
      </p>
    </div>
  );
};

export default PlayerCompareCard;
