import React, { useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, Save, X, Edit3 } from 'lucide-react';

const getLogoPath = (team) => {
  const teamLogoMap = {
    ARI: 'cardinals',
    ATL: 'falcons',
    BAL: 'ravens',
    BUF: 'bills',
    CAR: 'panthers',
    CHI: 'bears',
    CIN: 'bengals',
    CLE: 'browns',
    DAL: 'cowboys',
    DEN: 'broncos',
    DET: 'lions',
    GB: 'packers',
    HOU: 'texans',
    IND: 'colts',
    JAX: 'jaguars',
    KC: 'chiefs',
    LAC: 'chargers',
    LAR: 'rams',
    LAV: 'raiders',
    LV: 'raiders',
    MIA: 'dolphins',
    MIN: 'vikings',
    NE: 'patriots',
    NO: 'saints',
    NYG: 'giants',
    NYJ: 'jets',
    PHI: 'eagles',
    PIT: 'steelers',
    SF: '49ers',
    SEA: 'seahawks',
    TB: 'buccaneers',
    TEN: 'titans',
    WAS: 'commanders',
  };

  if (!team) return null;
  const logoId = teamLogoMap[team] || team.toLowerCase();
  return `/assets/logos/${logoId}.svg`;
};

const AdjustableRankings = ({ initialRanking = [], onSave, onCancel }) => {
  const [adjustedRanking, setAdjustedRanking] = useState(initialRanking);
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const movePlayer = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    setAdjustedRanking((prev) => {
      const newRanking = [...prev];
      const [movedPlayer] = newRanking.splice(fromIndex, 1);
      newRanking.splice(toIndex, 0, movedPlayer);
      return newRanking;
    });
  }, []);

  const moveUp = useCallback(
    (index) => {
      if (index > 0) {
        movePlayer(index, index - 1);
      }
    },
    [movePlayer]
  );

  const moveDown = useCallback(
    (index) => {
      if (index < adjustedRanking.length - 1) {
        movePlayer(index, index + 1);
      }
    },
    [movePlayer, adjustedRanking.length]
  );

  const handleDragStart = (e, index) => {
    setDraggedPlayer(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

    if (draggedPlayer !== null && draggedPlayer !== dropIndex) {
      movePlayer(draggedPlayer, dropIndex);
    }

    setDraggedPlayer(null);
    setDragOverIndex(null);
  };

  const handleSave = () => {
    onSave(adjustedRanking);
  };

  const hasChanges =
    JSON.stringify(adjustedRanking.map((p) => p.id)) !==
    JSON.stringify(initialRanking.map((p) => p.id));

  return (
    <div className="mt-6 mx-auto max-w-4xl px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent mb-2">
            <Edit3 size={24} className="inline mr-2 text-orange-400" />
            Adjust Your Rankings
          </h2>
          <p className="text-white/60">
            Fine-tune your results by dragging players or using the arrow
            buttons
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-white transition-all"
          >
            <Save size={16} />
            Save Adjustments
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium text-white transition-all"
          >
            <X size={16} />
            Cancel
          </button>
        </div>

        {hasChanges && (
          <div className="text-center text-orange-400 text-sm mb-4">
            <span className="bg-orange-600/20 px-3 py-1 rounded-full">
              You have unsaved changes
            </span>
          </div>
        )}
      </div>

      {/* Rankings List */}
      <div className="space-y-2">
        {adjustedRanking.map((player, index) => {
          const logoPath = getLogoPath(player.team);
          const headshot =
            player.headshotUrl ||
            `/assets/headshots/${player.player_id || player.id}.png`;

          return (
            <div
              key={player.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={`
                relative flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all cursor-move
                ${draggedPlayer === index ? 'opacity-50' : ''}
                ${dragOverIndex === index && draggedPlayer !== index ? 'border-orange-400 bg-orange-400/10' : ''}
              `}
            >
              {/* Rank Number */}
              <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full font-bold text-white text-lg">
                {index + 1}
              </div>

              {/* Player Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-800">
                <img
                  src={headshot}
                  alt={player.display_name || player.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/assets/headshots/default.png';
                  }}
                />
              </div>

              {/* Player Info */}
              <div className="flex-1">
                <div className="font-semibold text-white text-lg">
                  {player.display_name || player.name}
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  {logoPath && (
                    <div className="w-4 h-4">
                      <img
                        src={logoPath}
                        alt={player.team}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <span>{player.team?.toUpperCase() || 'FA'}</span>
                </div>
              </div>

              {/* Move Buttons */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-all"
                  title="Move up"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === adjustedRanking.length - 1}
                  className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-all"
                  title="Move down"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {/* Drag Handle Indicator */}
              <div className="text-white/40">
                <div className="w-2 h-8 flex flex-col justify-center gap-0.5">
                  <div className="w-full h-0.5 bg-current"></div>
                  <div className="w-full h-0.5 bg-current"></div>
                  <div className="w-full h-0.5 bg-current"></div>
                  <div className="w-full h-0.5 bg-current"></div>
                  <div className="w-full h-0.5 bg-current"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-white/5 rounded-lg text-center text-white/60 text-sm">
        <p className="mb-2">
          <strong className="text-white">How to adjust:</strong>
        </p>
        <p>
          • Drag and drop players to reorder them
          <br />
          • Use the ↑ ↓ buttons to move players up or down
          <br />• Save your changes when you're happy with the adjustments
        </p>
      </div>
    </div>
  );
};

export default AdjustableRankings;
