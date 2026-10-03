import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import RankingMovementIndicator from '@/components/shared/RankingMovementIndicator';
import RankSparkline from '@/features/rankings/history/RankSparkline';
import { rankHistoryFor, rankRange } from '@/utils/rankings/rankHistory';

/**
 * One saved version of the board, as it stood: every quarterback with his
 * movement against the version being compared to and the note he carried.
 * Opening a row shows his rank across every version loaded.
 */
const HistoryBoard = ({ entry, movement, history, showMovement }) => {
  const [openId, setOpenId] = useState(null);
  const rankings = entry.rankings || [];

  if (!rankings.length) {
    return (
      <div className="text-center py-12 text-white/50">
        This version has no quarterbacks on it.
      </div>
    );
  }

  return (
    <ol className="divide-y divide-white/5">
      {rankings.map((qb, index) => {
        const isOpen = openId === qb.id;
        const points = isOpen ? rankHistoryFor(history, qb) : null;
        const range = points ? rankRange(points) : null;
        const onBoards = points ? points.filter((p) => p.rank).length : 0;

        return (
          <li key={qb.id || index}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : qb.id)}
              className="w-full flex items-center gap-3 px-2 py-2 text-left hover:bg-white/5 rounded-md"
            >
              <span className="w-7 text-right font-bold tabular-nums text-white/90">
                {index + 1}
              </span>
              <span className="w-14 flex justify-center">
                {showMovement && (
                  <RankingMovementIndicator movement={movement[qb.id]} />
                )}
              </span>
              <img
                src={qb.imageUrl || `/assets/headshots/${qb.id}.png`}
                onError={(event) => {
                  event.currentTarget.src = '/assets/headshots/default.png';
                }}
                alt=""
                className="w-9 h-9 rounded-full object-cover bg-white/5"
                loading="lazy"
              />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-white truncate">
                  {qb.name}
                </span>
                <span className="block text-xs text-white/45 truncate">
                  {qb.team}
                  {qb.notes && (
                    <span className="text-white/60 italic">
                      {qb.team ? ' · ' : ''}
                      {qb.notes}
                    </span>
                  )}
                </span>
              </span>
              {isOpen ? (
                <ChevronDown size={16} className="text-white/40" />
              ) : (
                <ChevronRight size={16} className="text-white/30" />
              )}
            </button>

            {isOpen && (
              <div className="ml-12 mb-3 mt-1 px-3 py-3 rounded-lg bg-white/5 flex flex-wrap items-center gap-x-6 gap-y-2">
                <RankSparkline points={points} highlightId={entry.id} />
                <div className="text-xs text-white/60 space-y-0.5">
                  {range ? (
                    <>
                      <div>
                        Best <span className="text-white">#{range.best}</span>
                        {' · '}Worst{' '}
                        <span className="text-white">#{range.worst}</span>
                      </div>
                      <div>
                        On {onBoards} of {points.length} versions loaded
                      </div>
                    </>
                  ) : (
                    <div>No other versions to compare.</div>
                  )}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
};

HistoryBoard.propTypes = {
  entry: PropTypes.object.isRequired,
  movement: PropTypes.object.isRequired,
  history: PropTypes.array.isRequired,
  showMovement: PropTypes.bool,
};

export default HistoryBoard;
