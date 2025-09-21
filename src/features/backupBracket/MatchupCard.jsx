import React, { useMemo } from 'react';
import clsx from 'clsx';

const MATCH_HEIGHT = 96;
const CONNECTOR_LENGTH = 56;

const MatchupCard = ({
  roundIndex,
  matchIndex,
  participants,
  winnerId,
  onSelect,
  onHover,
  onHoverEnd,
  isLastRound,
  centerSpacing,
  placeholderLabels = [],
}) => {
  const participantRows = useMemo(() => {
    return participants.map((participant, participantIndex) => {
      if (!participant) {
        return {
          id: `placeholder-${participantIndex}`,
          label: placeholderLabels[participantIndex] || 'TBD',
          seed: null,
          status: 'pending',
          team: '',
          isPlaceholder: true,
        };
      }

      const isWinner = winnerId === participant.id;
      const status = winnerId ? (isWinner ? 'winner' : 'eliminated') : 'pending';

      return {
        id: participant.id,
        label: participant.display_name,
        seed: participant.seed,
        status,
        team: participant.team || 'FA',
        isPlaceholder: false,
      };
    });
  }, [participants, winnerId]);

  const handleSelect = (participant) => {
    if (participant.isPlaceholder) return;
    onSelect(participant.id);
  };

  const handleKeyDown = (event, participant) => {
    if (participant.isPlaceholder) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(participant.id);
    }
  };

  return (
    <div
      className="relative"
      style={{ height: `${MATCH_HEIGHT}px` }}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      onFocus={onHover}
      onBlur={onHoverEnd}
    >
      <div className="h-full rounded-xl border border-white/10 bg-neutral-800/70 backdrop-blur-sm shadow-lg overflow-hidden flex flex-col">
        {participantRows.map((participant, index) => {
          const showDivider = index === 1;
          const statusClasses =
            participant.status === 'winner'
              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-inner'
              : participant.status === 'eliminated'
              ? 'bg-neutral-800/40 text-white/40 line-through'
              : 'hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400';

          return (
            <button
              key={participant.id}
              type="button"
              className={clsx(
                'w-full text-left px-4 py-3 transition-colors focus:outline-none flex-1 flex items-center justify-between gap-3',
                statusClasses,
                showDivider && 'border-t border-white/10'
              )}
              disabled={participant.isPlaceholder}
              onClick={() => handleSelect(participant)}
              onKeyDown={(event) => handleKeyDown(event, participant)}
              aria-pressed={participant.status === 'winner'}
              aria-label={
                participant.isPlaceholder
                  ? 'Waiting on previous result'
                  : `Select ${participant.label} as winner`
              }
              style={{ minHeight: `${MATCH_HEIGHT / participantRows.length}px` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-white/50">
                  {participant.seed ? `#${participant.seed}` : '—'}
                </span>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm md:text-base">
                    {participant.label}
                  </span>
                  {participant.team && !participant.isPlaceholder && (
                    <span className="text-[10px] uppercase tracking-widest text-white/40">
                      {participant.team}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={clsx(
                  'text-xs font-semibold uppercase tracking-wide text-right min-w-[44px]',
                  participant.status === 'winner'
                    ? 'text-emerald-300'
                    : participant.status === 'eliminated'
                    ? 'text-white/30'
                    : 'text-white/40'
                )}
              >
                {participant.status === 'winner'
                  ? ' '
                  : participant.status === 'eliminated'
                  ? 'Out'
                  : participant.isPlaceholder
                  ? 'TBD'
                  : 'Pick'}
              </span>
            </button>
          );
        })}
      </div>

      {!isLastRound && (
        <div
          aria-hidden="true"
          className="absolute top-1/2 h-px bg-white/10"
          style={{ width: `${CONNECTOR_LENGTH}px`, right: `-${CONNECTOR_LENGTH}px` }}
        />
      )}

      {!isLastRound && matchIndex % 2 === 0 && (
        <div
          aria-hidden="true"
          className="absolute w-px bg-white/10"
          style={{
            top: '50%',
            height: `${centerSpacing}px`,
            right: `-${CONNECTOR_LENGTH}px`,
          }}
        />
      )}
    </div>
  );
};

export default MatchupCard;
export { MATCH_HEIGHT };
