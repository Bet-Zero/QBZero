import React from 'react';
import PropTypes from 'prop-types';
import {
  formatArchiveDate,
  formatRankingDate,
  formatReplacedDate,
} from '@/utils/formatting/rankingDates';
import { describeRankingChange } from '@/utils/rankings/rankingSummary';

/**
 * Every version of the personal board, newest first, as a vertical timeline.
 * The live board heads it; each archive below says when it was saved, how long
 * it stood, what changed against the one before it, and the note it was saved
 * with.
 */
const HistoryTimeline = ({
  entries,
  selectedId,
  onSelect,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
}) => (
  <nav aria-label="Ranking versions" className="relative">
    <ol className="relative border-l border-white/10 ml-2 space-y-1">
      {entries.map((entry) => {
        const isSelected = entry.id === selectedId;
        const isCurrent = entry.kind === 'current';
        const change = describeRankingChange(entry.summary);

        return (
          <li key={entry.id} className="relative pl-5">
            <span
              aria-hidden="true"
              className={`absolute -left-[5px] top-4 w-2.5 h-2.5 rounded-full border-2 ${
                isCurrent
                  ? 'bg-green-400 border-green-300'
                  : isSelected
                    ? 'bg-blue-400 border-blue-300'
                    : 'bg-neutral-900 border-white/30'
              }`}
            />
            <button
              type="button"
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => onSelect(entry)}
              className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                isSelected
                  ? 'bg-white/10 ring-1 ring-blue-400/50'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-white">
                  {isCurrent
                    ? formatRankingDate(entry)
                    : formatArchiveDate(entry)}
                </span>
                {isCurrent && (
                  <span className="text-[10px] uppercase tracking-wide font-bold text-green-400">
                    Current
                  </span>
                )}
              </div>
              <div className="text-[11px] text-white/45">
                {entry.rankings?.length || 0} QBs
                {!isCurrent && !entry.dateIsReplacement && (
                  <> · until {formatReplacedDate(entry)}</>
                )}
              </div>
              {change && (
                <div className="text-[11px] text-white/65 mt-0.5">{change}</div>
              )}
              {entry.notes && (
                <div className="text-xs text-white/75 italic mt-1 line-clamp-2">
                  “{entry.notes}”
                </div>
              )}
            </button>
          </li>
        );
      })}
    </ol>

    {hasMore && onLoadMore && (
      <button
        type="button"
        onClick={onLoadMore}
        disabled={loadingMore}
        className="mt-3 ml-7 text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
      >
        {loadingMore ? 'Loading…' : 'Load older rankings'}
      </button>
    )}
  </nav>
);

HistoryTimeline.propTypes = {
  entries: PropTypes.array.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  hasMore: PropTypes.bool,
  onLoadMore: PropTypes.func,
  loadingMore: PropTypes.bool,
};

export default HistoryTimeline;
