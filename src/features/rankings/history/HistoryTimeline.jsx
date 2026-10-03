import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  formatRankingDate,
  formatReplacedDate,
  rankingDate,
} from '@/utils/formatting/rankingDates';
import {
  MONTH_INITIALS,
  groupByMonth,
  groupByYear,
  monthKey,
  monthName,
} from '@/utils/rankings/historyGroups';
import { describeRankingChangeLines } from '@/utils/rankings/rankingSummary';

/**
 * The heading for one version: the stretch it was your ranking for. The oldest
 * archive from before save dates were stored only knows when it was replaced.
 */
const periodLabel = (entry, isCurrent) => {
  if (isCurrent) return `Since ${formatRankingDate(entry)}`;
  if (entry.dateIsReplacement) return `Before ${formatReplacedDate(entry)}`;
  return `${formatRankingDate(entry)} – ${formatReplacedDate(entry)}`;
};

/** One version in the full list. */
const VersionRow = ({ entry, selectedId, onSelect }) => {
  const isSelected = entry.id === selectedId;
  const isCurrent = entry.kind === 'current';
  const changes = describeRankingChangeLines(entry.summary);

  return (
    <li className="relative pl-5">
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
            {periodLabel(entry, isCurrent)}
          </span>
          {isCurrent && (
            <span className="text-[10px] uppercase tracking-wide font-bold text-green-400">
              Current
            </span>
          )}
        </div>
        <div className="text-[11px] text-white/45">
          {entry.rankings?.length || 0} QBs ranked
          {entry.dateIsReplacement && ' · exact save date not recorded'}
        </div>
        {changes.length > 0 ? (
          <div className="text-[11px] text-white/65 mt-1 space-y-0.5">
            {changes.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        ) : (
          !isCurrent && (
            <div className="text-[11px] text-white/40 mt-1">
              Earliest version loaded
            </div>
          )
        )}
        {entry.notes && (
          <div className="text-xs text-white/75 italic mt-1 line-clamp-2">
            Note: “{entry.notes}”
          </div>
        )}
      </button>
    </li>
  );
};

VersionRow.propTypes = {
  entry: PropTypes.object.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};

const ZOOMS = [
  { key: 'years', label: 'Years' },
  { key: 'months', label: 'Months' },
  { key: 'all', label: 'All' },
];

const versions = (count) => `${count} version${count === 1 ? '' : 's'}`;
const leader = (group) => group.entries[0]?.rankings?.[0]?.name;
const SHORT = { month: 'short', day: 'numeric' };
const span = (group) => {
  const newest = rankingDate(group.entries[0]);
  const oldest = rankingDate(group.entries[group.entries.length - 1]);
  if (!newest || !oldest) return null;
  const a = oldest.toLocaleDateString('en-US', SHORT);
  const b = newest.toLocaleDateString('en-US', SHORT);
  return a === b ? a : `${a} – ${b}`;
};

/**
 * Every version of the personal board, newest first, at three zoom levels --
 * the way a photo library steps out from days to months to years.
 *
 * "All" is the full list, filed under month headings. "Months" is one row per
 * month, "Years" one card per year with a strip showing which months had
 * saves. Picking a year steps in to its months; picking a month steps in to
 * the full list at that month and opens its newest version. Zooming out reads
 * the whole history rather than the loaded page, so every period is there.
 */
const HistoryTimeline = ({
  entries,
  selectedId,
  onSelect,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  onLoadAll,
}) => {
  const [zoom, setZoom] = useState('all');
  const [jumpTo, setJumpTo] = useState(null);
  const anchors = useRef(new Map());

  const months = useMemo(() => groupByMonth(entries), [entries]);
  const years = useMemo(() => groupByYear(entries), [entries]);
  const selectedMonth = monthKey(
    entries.find((entry) => entry.id === selectedId)
  );

  // After stepping in, bring the period that was picked into view.
  useEffect(() => {
    if (!jumpTo) return;
    anchors.current
      .get(jumpTo)
      ?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
    setJumpTo(null);
  }, [jumpTo, zoom]);

  const anchor = (key) => (node) => {
    if (node) anchors.current.set(key, node);
    else anchors.current.delete(key);
  };

  const changeZoom = (next) => {
    setZoom(next);
    if (next !== 'all' && hasMore) onLoadAll?.();
  };

  const openMonth = (month) => {
    setZoom('all');
    setJumpTo(`month-${month.key}`);
    onSelect(month.entries[0]);
  };

  const openYear = (year) => {
    setZoom('months');
    setJumpTo(`year-${year.key}`);
  };

  return (
    <nav aria-label="Ranking versions" className="relative">
      <div
        role="tablist"
        aria-label="Timeline zoom"
        className="sticky top-0 z-10 mb-3 flex rounded-lg bg-neutral-900/95 p-1 ring-1 ring-white/10 backdrop-blur"
      >
        {ZOOMS.map((option) => (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={zoom === option.key}
            onClick={() => changeZoom(option.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              zoom === option.key
                ? 'bg-white/15 text-white'
                : 'text-white/55 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {zoom !== 'all' && loadingMore && (
        <div className="mb-2 text-xs text-white/50">
          Loading your full history…
        </div>
      )}

      {zoom === 'years' && (
        <div className="space-y-2">
          {years.map((year) => {
            const peak = Math.max(...year.counts, 1);
            const holdsSelected = year.months.some(
              (month) => month.key === selectedMonth
            );
            return (
              <div
                key={year.key}
                className={`rounded-xl p-4 transition-colors ${
                  holdsSelected
                    ? 'bg-white/10 ring-1 ring-blue-400/50'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => openYear(year)}
                  className="w-full text-left"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-white">
                      {year.label}
                    </span>
                    <span className="text-xs text-white/50">
                      {versions(year.total)}
                    </span>
                  </div>
                  {leader(year.months[0]) && (
                    <div className="mt-0.5 text-[11px] text-white/55">
                      No. 1 at the end: {leader(year.months[0])}
                    </div>
                  )}
                </button>
                {year.year != null && (
                  <div className="mt-3 grid grid-cols-12 gap-1">
                    {year.counts.map((count, index) => {
                      const month = year.months.find(
                        (candidate) => candidate.month === index
                      );
                      return (
                        <button
                          key={index}
                          type="button"
                          disabled={!count}
                          onClick={() => month && openMonth(month)}
                          title={`${monthName(index)}: ${versions(count)}`}
                          aria-label={`${monthName(index)} ${year.label}, ${versions(count)}`}
                          className="group flex flex-col items-center gap-1 disabled:cursor-default"
                        >
                          <span
                            className={`h-6 w-full rounded ${
                              count ? 'bg-blue-400' : 'bg-white/5'
                            } group-enabled:group-hover:ring-1 group-enabled:group-hover:ring-white/60`}
                            style={
                              count
                                ? { opacity: 0.35 + 0.65 * (count / peak) }
                                : undefined
                            }
                          />
                          <span className="text-[9px] text-white/40">
                            {MONTH_INITIALS[index]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {zoom === 'months' && (
        <div className="space-y-4">
          {years.map((year) => (
            <section
              key={year.key}
              ref={anchor(`year-${year.key}`)}
              className="scroll-mt-14"
            >
              <h3 className="sticky top-12 z-[1] bg-neutral-900/95 py-1 text-sm font-bold text-white/80 backdrop-blur">
                {year.label}
              </h3>
              <div className="mt-1 space-y-1">
                {year.months.map((month) => (
                  <button
                    key={month.key}
                    type="button"
                    onClick={() => openMonth(month)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                      month.key === selectedMonth
                        ? 'bg-white/10 ring-1 ring-blue-400/50'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-white">
                        {month.label}
                      </span>
                      <span className="text-[11px] text-white/50">
                        {versions(month.entries.length)}
                      </span>
                    </div>
                    <div className="text-[11px] text-white/45">
                      {span(month)}
                      {leader(month) && <> · No. 1: {leader(month)}</>}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {zoom === 'all' && (
        <>
          {months.map((month) => (
            <section
              key={month.key}
              ref={anchor(`month-${month.key}`)}
              className="scroll-mt-14"
            >
              <h3 className="sticky top-12 z-[1] -ml-1 bg-neutral-900/95 px-1 py-1 text-xs font-bold uppercase tracking-wide text-white/50 backdrop-blur">
                {month.label}
              </h3>
              <ol className="relative border-l border-white/10 ml-2 space-y-1 pb-2">
                {month.entries.map((entry) => (
                  <VersionRow
                    key={entry.id}
                    entry={entry}
                    selectedId={selectedId}
                    onSelect={onSelect}
                  />
                ))}
              </ol>
            </section>
          ))}

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
        </>
      )}
    </nav>
  );
};

HistoryTimeline.propTypes = {
  entries: PropTypes.array.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  hasMore: PropTypes.bool,
  onLoadMore: PropTypes.func,
  loadingMore: PropTypes.bool,
  onLoadAll: PropTypes.func,
};

export default HistoryTimeline;
