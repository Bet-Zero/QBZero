import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Edit3 } from 'lucide-react';

// Mapping team abbreviations to logo file names
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

const QBRankingCard = ({
  qb,
  onMoveUp,
  onMoveDown,
  onRemove,
  onEditNotes,
  canMoveUp,
  canMoveDown,
  readOnly = false,
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(qb.notes || '');

  const handleSaveNotes = () => {
    onEditNotes(notesValue);
    setIsEditingNotes(false);
  };

  const handleCancelNotes = () => {
    setNotesValue(qb.notes || '');
    setIsEditingNotes(false);
  };

  // Get team logo for background
  const getTeamLogo = () => {
    if (!qb.team || qb.team === 'N/A') return null;
    return `/assets/logos/${teamLogoMap[qb.team] || qb.team.toLowerCase()}.svg`;
  };

  const teamLogo = getTeamLogo();

  return (
    <div className="group relative bg-[#1a1a1a] hover:bg-[#1f1f1f] border border-white/10 rounded-xl transition-all duration-300 hover:border-white/20 overflow-hidden">
      {/* Team Logo Background */}
      {teamLogo && (
        <div
          className="absolute inset-0 opacity-10 bg-center bg-no-repeat bg-contain"
          style={{
            backgroundImage: `url(${teamLogo})`,
          }}
        />
      )}

      {/* Controls */}
      {!readOnly && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-1.5 bg-black/40 hover:bg-black/60 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all backdrop-blur-sm"
            title="Move up"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-1.5 bg-black/40 hover:bg-black/60 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all backdrop-blur-sm"
            title="Move down"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={() => setIsEditingNotes(!isEditingNotes)}
            className="p-1.5 bg-black/40 hover:bg-black/60 rounded-lg transition-all backdrop-blur-sm"
            title="Edit notes"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 bg-red-500/60 hover:bg-red-500/80 rounded-lg transition-all backdrop-blur-sm"
            title="Remove"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div className="flex relative z-10 min-h-[80px]">
        {/* Rank Number Container - Cool but Mobile-Friendly */}
        <div className="w-12 min-w-[48px] flex items-center justify-center bg-white/20 backdrop-blur-sm overflow-hidden relative rounded-l-lg">
          <div
            className="text-white font-black text-center leading-none select-none"
            style={{
              fontFamily: '"Bebas Neue", Impact, "Arial Black", sans-serif',
              fontSize: qb.rank >= 10 ? '2.75rem' : '3.25rem',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              transform: 'scaleY(1.2) translateY(2px)', // Shifted from -2px to +2px
              letterSpacing: qb.rank >= 10 ? '-0.02em' : '0.02em',
              // Adjust horizontal position based on digit count
              marginLeft: qb.rank >= 10 ? '1px' : '-1px',
              // Fine-tune positioning for better optical centering
              position: 'relative',
              top: '2px', // Shifted from 1px to 2px
            }}
          >
            {qb.rank}
          </div>
          {/* Subtle gradient overlay for extra style */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-l-lg" />
        </div>

        {/* QB Image - Full Height */}
        <div className="w-20 bg-[#121212] flex-shrink-0 flex">
          <img
            src={qb.imageUrl}
            alt={qb.name}
            className="w-full flex-1 object-cover"
            onError={(e) => {
              e.target.src = '/assets/headshots/default.png';
            }}
          />
        </div>

        {/* QB Info */}
        <div className="flex-1 p-4">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-white drop-shadow-lg">
              {qb.name}
            </h3>
            {qb.team && (
              <div className="flex items-center gap-2 px-2 py-1 bg-[#111]/80 backdrop-blur-sm rounded text-white/80">
                <div
                  className="w-4 h-4 bg-center bg-no-repeat bg-contain"
                  style={{
                    backgroundImage: `url(${teamLogo})`,
                  }}
                />
                <span className="text-xs font-medium">{qb.team}</span>
              </div>
            )}
          </div>

          {/* Notes Section */}
          {isEditingNotes && !readOnly ? (
            <div className="space-y-2">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Add your notes about this QB..."
                className="w-full p-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:outline-none resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNotes}
                  className="px-3 py-1 bg-green-600/80 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition-all backdrop-blur-sm"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelNotes}
                  className="px-3 py-1 bg-black/60 hover:bg-black/80 rounded-lg text-white text-sm font-medium transition-all backdrop-blur-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-white/70 text-sm drop-shadow-lg">
              {qb.notes || (
                <span className="italic text-white/40">
                  {readOnly
                    ? 'No notes'
                    : 'Click edit to add notes about this QB...'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QBRankingCard;
