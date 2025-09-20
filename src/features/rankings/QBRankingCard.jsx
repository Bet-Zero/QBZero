import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Edit3 } from 'lucide-react';
import RankingMovementIndicator from '@/components/shared/RankingMovementIndicator';

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
  movement = null, // Movement data from ranking comparison
  showMovement = false, // Toggle for showing movement indicators
  isArchiveMode = false, // New prop to indicate this is being used in archive display
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

  // Make all notes use the smallest text size on mobile, normal on desktop
  const getNotesTextClasses = (text) => {
    // For archive mode, always use constrained classes to prevent stretching
    if (isArchiveMode) {
      return 'text-[11px] leading-[12px] sm:text-sm sm:leading-normal line-clamp-2 overflow-hidden';
    }
    // Mobile: Always use the smallest size (10px) for uniformity
    // Desktop: Use normal text size
    return 'text-[11px] leading-[12px] sm:text-sm sm:leading-normal';
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

      {/* Fixed height container - Mobile: 90px, Desktop: ORIGINAL flexible layout OR fixed for archive mode */}
      <div
        className={`flex relative z-10 ${
          isArchiveMode
            ? 'h-[90px] sm:h-[100px]' // Fixed height for archive mode on both mobile and desktop
            : 'h-[90px] sm:min-h-[80px] sm:h-auto' // Original flexible height for regular rankings
        }`}
      >
        {/* Rank Number Container - Mobile compact, Desktop ORIGINAL */}
        <div className="w-10 min-w-[40px] sm:w-12 sm:min-w-[48px] flex items-center justify-center bg-white/20 backdrop-blur-sm overflow-hidden relative rounded-l-lg">
          <div
            className="text-white font-black text-center leading-none select-none"
            style={{
              fontFamily: '"Bebas Neue", Impact, "Arial Black", sans-serif',
              fontSize: qb.rank >= 10 ? '2.25rem' : '2.75rem',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              transform: 'scaleY(1.2) translateY(2px)', // Desktop original
              letterSpacing: qb.rank >= 10 ? '-0.02em' : '0.02em',
              marginLeft: qb.rank >= 10 ? '1px' : '-1px',
              position: 'relative',
              top: '2px', // Desktop original
            }}
          >
            {qb.rank}
          </div>

          {/* Movement Indicator positioned in top-right corner of rank number */}
          {showMovement && movement && (
            <div className="absolute top-1 -right-1 sm:top-0 sm:right-0 transform scale-75 sm:scale-90 z-10">
              <RankingMovementIndicator
                movement={movement}
                showMovement={showMovement}
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-l-lg" />
        </div>

        {/* QB Image - Mobile smaller, Desktop ORIGINAL */}
        <div className="w-16 sm:w-20 bg-[#121212] flex-shrink-0 flex">
          <img
            src={qb.imageUrl}
            alt={qb.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/assets/headshots/default.png';
            }}
          />
        </div>

        {/* QB Info - Mobile compact, Desktop ORIGINAL */}
        <div className="flex-1 p-3 sm:p-4 overflow-hidden">
          {/* Header section - Mobile minimal, Desktop ORIGINAL */}
          <div className="mb-1 sm:mb-2">
            <div className="flex items-start gap-2 sm:gap-3">
              <h3
                className={`font-bold text-white drop-shadow-lg leading-tight ${
                  isArchiveMode
                    ? 'text-sm sm:text-xl' // Archive mode: force smaller text on mobile for 2-line names
                    : 'text-base sm:text-xl' // Regular mode: keep original sizing
                }`}
              >
                {/* Force 2-line layout on mobile for archive mode only */}
                {isArchiveMode ? (
                  <span className="block sm:inline">
                    {/* On mobile, split name and force 2 lines. On desktop, keep inline with proper spacing */}
                    <span className="block sm:inline">
                      {qb.name.split(' ').slice(0, -1).join(' ')}
                    </span>
                    {qb.name.split(' ').length > 1 && (
                      <>
                        <span className="hidden sm:inline"> </span>{' '}
                        {/* Add space back for desktop */}
                        <span className="block sm:inline">
                          {qb.name.split(' ').slice(-1)[0]}
                        </span>
                      </>
                    )}
                  </span>
                ) : (
                  qb.name
                )}
              </h3>

              {qb.team && (
                <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#111]/80 backdrop-blur-sm rounded text-white/80 flex-shrink-0">
                  <div
                    className="w-2.5 h-2.5 sm:w-4 sm:h-4 bg-center bg-no-repeat bg-contain"
                    style={{
                      backgroundImage: `url(${teamLogo})`,
                    }}
                  />
                  <span className="text-[9px] sm:text-xs font-medium">
                    {qb.team}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section - Mobile minimal with extra space above, Desktop ORIGINAL */}
          <div className="mt-2 sm:mt-0">
            {isEditingNotes && !readOnly ? (
              <div className="space-y-1.5 sm:space-y-2">
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Add your notes about this QB..."
                  className="w-full h-8 sm:h-auto p-1.5 sm:p-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded sm:rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:outline-none resize-none text-xs sm:text-sm"
                  rows={2}
                />
                <div className="flex gap-1.5 sm:gap-2">
                  <button
                    onClick={handleSaveNotes}
                    className="px-2 py-0.5 sm:px-3 sm:py-1 bg-green-600/80 hover:bg-green-700 rounded sm:rounded-lg text-white text-[10px] sm:text-sm font-medium transition-all backdrop-blur-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelNotes}
                    className="px-2 py-0.5 sm:px-3 sm:py-1 bg-black/60 hover:bg-black/80 rounded sm:rounded-lg text-white text-[10px] sm:text-sm font-medium transition-all backdrop-blur-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`text-white/70 drop-shadow-lg ${getNotesTextClasses(qb.notes)}`}
                title={isArchiveMode && qb.notes ? qb.notes : undefined} // Show full notes on hover in archive mode
              >
                {qb.notes || (
                  <span className="italic text-white/40 text-[9px] sm:text-sm">
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
    </div>
  );
};

export default QBRankingCard;
