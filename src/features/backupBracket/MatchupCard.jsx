import React, { useMemo } from 'react';
import clsx from 'clsx';

// A stable default: a fresh [] each render would defeat the memo below.
const EMPTY_LABELS = [];

const MATCH_HEIGHT = 96;
// Half the gap between columns: each card draws its own half of the line.
const CONNECTOR_LENGTH = 48;
const COLUMN_GAP = CONNECTOR_LENGTH * 2;

const MatchupCard = ({
  matchIndex,
  participants,
  winnerId,
  onSelect,
  isFirstRound,
  isLastRound,
  centerSpacing,
  placeholderLabels = EMPTY_LABELS,
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
      const status = winnerId
        ? isWinner
          ? 'winner'
          : 'eliminated'
        : 'pending';

      return {
        id: participant.id,
        label: participant.display_name,
        seed: participant.seed,
        status,
        team: participant.team || 'FA',
        isPlaceholder: false,
      };
    });
  }, [participants, winnerId, placeholderLabels]);

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
    <div className="relative" style={{ height: `${MATCH_HEIGHT}px` }}>
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
                'w-full min-w-0 text-left px-3 py-1.5 transition-colors focus:outline-none flex-1 flex items-center justify-between gap-2',
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
              style={{
                minHeight: `${MATCH_HEIGHT / participantRows.length}px`,
              }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="w-6 shrink-0 text-xs font-semibold text-white/50">
                  {participant.seed ? `#${participant.seed}` : '—'}
                </span>
                <div className="flex min-w-0 flex-col leading-tight">
                  <span
                    className={clsx(
                      'truncate text-sm',
                      participant.isPlaceholder
                        ? 'text-white/40'
                        : 'font-semibold'
                    )}
                    title={participant.label}
                  >
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
                  'shrink-0 text-xs font-semibold uppercase tracking-wide text-right',
                  participant.status === 'winner'
                    ? 'text-emerald-300'
                    : participant.status === 'eliminated'
                      ? 'text-white/30'
                      : 'text-white/40'
                )}
              >
                {participant.status === 'winner'
                  ? '✓'
                  : participant.status === 'eliminated'
                    ? 'Out'
                    : ''}
              </span>
            </button>
          );
        })}
      </div>

      {!isFirstRound && (
        <div
          aria-hidden="true"
          className="absolute top-1/2 h-px bg-white/10"
          style={{
            width: `${CONNECTOR_LENGTH}px`,
            left: `-${CONNECTOR_LENGTH}px`,
          }}
        />
      )}

      {!isLastRound && (
        <div
          aria-hidden="true"
          className="absolute top-1/2 h-px bg-white/10"
          style={{
            width: `${CONNECTOR_LENGTH}px`,
            right: `-${CONNECTOR_LENGTH}px`,
          }}
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
export { MATCH_HEIGHT, COLUMN_GAP };
