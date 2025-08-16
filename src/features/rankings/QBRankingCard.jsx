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
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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

      <div className="flex relative z-10 min-h-[80px]">
        {/* Rank Number Container */}
        <div className="w-12 flex items-center justify-center bg-white/20 backdrop-blur-sm overflow-hidden">
          <div
            className="font-bold text-white italic"
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.9)',
              fontFamily: '"Bebas Neue", Impact, "Arial Black", sans-serif',
              fontSize: qb.rank >= 10 ? '3.5rem' : '4.5rem',
              lineHeight: '1.0',
              transform: `scaleX(${qb.rank >= 10 ? '1.0' : '1.0'}) skewX(-6deg) scaleY(1.3)`,
              letterSpacing: qb.rank >= 10 ? '-0.05em' : '0.05em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              marginTop: '8px',
              marginLeft: qb.rank >= 10 ? '-16px' : '-8px',
            }}
          >
            {qb.rank}
          </div>
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
              <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                {qb.team}
              </span>
            )}
          </div>

          {/* Notes Section */}
          {isEditingNotes ? (
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
                  Click edit to add notes about this QB...
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
