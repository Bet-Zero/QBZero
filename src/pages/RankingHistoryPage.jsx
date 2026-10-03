import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import usePersonalRankingHistory from '@/hooks/usePersonalRankingHistory';
import HistoryTimeline from '@/features/rankings/history/HistoryTimeline';
import HistoryBoard from '@/features/rankings/history/HistoryBoard';
import RankingsExportModal from '@/components/shared/RankingsExportModal';
import {
  formatArchiveDate,
  formatRankingDate,
  formatReplacedDate,
} from '@/utils/formatting/rankingDates';
import {
  describeRankingChangeLines,
  summariseRankingChange,
} from '@/utils/rankings/rankingSummary';
import {
  calculateRankingMovement,
  matchRankings,
} from '@/utils/rankingMovement';

const CURRENT_ID = 'current';

const entryLabel = (entry) =>
  entry.kind === 'current'
    ? `Current (${formatRankingDate(entry)})`
    : formatArchiveDate(entry);

/**
 * Every version of the personal rankings in one place.
 *
 * The timeline lists the live board and each archive. Picking one shows the
 * whole board as it stood, with movement against the version before it -- or
 * against any other version, so two dates months apart can be laid side by
 * side. The selection lives in the URL (`?v=` and `?vs=`), so a version can be
 * linked to directly.
 */
const RankingHistoryPage = () => {
  const {
    current,
    archives,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    error,
    busyId,
    restore,
    remove,
  } = usePersonalRankingHistory();
  const [params, setParams] = useSearchParams();
  const [exporting, setExporting] = useState(false);

  // Newest first, live board at the head. The live board's summary is against
  // the newest archive -- the version it replaced.
  const entries = useMemo(() => {
    const list = archives.map((archive) => ({ ...archive, kind: 'archive' }));
    if (current) {
      list.unshift({
        ...current,
        id: CURRENT_ID,
        docId: current.id,
        kind: 'current',
        summary: summariseRankingChange(
          current.rankings,
          archives[0]?.rankings
        ),
      });
    }
    return list;
  }, [current, archives]);

  const selectedIndex = Math.max(
    0,
    entries.findIndex((entry) => entry.id === params.get('v'))
  );
  const selected = entries[selectedIndex];

  // Compared against the version before it unless another was picked.
  const compareParam = params.get('vs');
  const compareTo =
    (compareParam &&
      compareParam !== selected?.id &&
      entries.find((entry) => entry.id === compareParam)) ||
    entries[selectedIndex + 1] ||
    null;

  const movement = useMemo(
    () =>
      selected && compareTo
        ? calculateRankingMovement(
            selected.rankings || [],
            compareTo.rankings || []
          )
        : {},
    [selected, compareTo]
  );

  const comparedSummary = useMemo(
    () =>
      selected && compareTo
        ? summariseRankingChange(selected.rankings, compareTo.rankings)
        : null,
    [selected, compareTo]
  );

  // Who was on the compared version but is not on this one.
  const dropped = useMemo(() => {
    if (!selected || !compareTo) return [];
    const { matched } = matchRankings(
      selected.rankings || [],
      compareTo.rankings || []
    );
    return (compareTo.rankings || []).filter((_, index) => !matched.has(index));
  }, [selected, compareTo]);

  const select = (entry) => setParams(entry ? { v: entry.id } : {});

  const setCompare = (id) => {
    const next = { v: selected.id };
    if (id) next.vs = id;
    setParams(next);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white/60">
        Loading ranking history…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Ranking History
          </h1>
          <p className="text-white/55 mt-1">
            Every version of your personal QB rankings
            {archives.length > 0 && (
              <>
                {' '}
                · {archives.length}
                {hasMore ? '+' : ''} saved before the current one
              </>
            )}
          </p>
        </div>
        <Link
          to="/rankings/edit"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
        >
          <Pencil size={14} />
          Edit current rankings
        </Link>
      </header>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-500/40 bg-red-900/20 text-red-200 text-sm">
          {error}
        </div>
      )}

      {!selected ? (
        <div className="text-center py-16 text-white/60">
          Nothing saved yet. Your first save starts the history.
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <aside className="max-h-80 overflow-y-auto lg:max-h-[calc(100vh-3rem)] lg:sticky lg:top-6 lg:self-start archive-scrollbar pr-1">
            <HistoryTimeline
              entries={entries}
              selectedId={selected.id}
              onSelect={select}
              hasMore={hasMore}
              onLoadMore={loadMore}
              loadingMore={loadingMore}
            />
          </aside>

          <section className="min-w-0 bg-neutral-800/40 border border-white/10 rounded-xl">
            <div className="p-5 border-b border-white/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide font-semibold text-white/40">
                    {selected.kind === 'current'
                      ? 'Current rankings'
                      : 'Saved ranking'}
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {selected.kind === 'current'
                      ? formatRankingDate(selected, { withTime: true })
                      : formatArchiveDate(selected, { withTime: true })}
                  </h2>
                  <div className="text-sm text-white/55">
                    {selected.rankings?.length || 0} QBs
                    {selected.kind === 'archive' &&
                      !selected.dateIsReplacement && (
                        <> · current until {formatReplacedDate(selected)}</>
                      )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setExporting(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white"
                  >
                    <Download size={14} />
                    Export
                  </button>
                  {selected.kind === 'archive' && (
                    <>
                      <button
                        type="button"
                        disabled={busyId === selected.id}
                        onClick={async () => {
                          // Show the board it just became.
                          if (await restore(selected)) select(entries[0]);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 rounded-lg text-sm text-white"
                      >
                        <RotateCcw size={14} />
                        {busyId === selected.id ? 'Working…' : 'Restore'}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === selected.id}
                        onClick={() => remove(selected)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 hover:bg-red-600/40 disabled:opacity-40 rounded-lg text-sm text-red-300"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {selected.notes && (
                <p className="mt-3 text-white/80 italic border-l-2 border-blue-400/50 pl-3">
                  {selected.notes}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <label className="flex items-center gap-2 text-white/60">
                  Compared with
                  <select
                    value={compareTo?.id || ''}
                    onChange={(event) => setCompare(event.target.value)}
                    className="bg-neutral-900 border border-white/15 rounded-md px-2 py-1 text-white text-sm"
                  >
                    {!compareTo && <option value="">Nothing to compare</option>}
                    {entries
                      .filter((entry) => entry.id !== selected.id)
                      .map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entryLabel(entry)}
                          {entry === entries[selectedIndex + 1]
                            ? ' (previous)'
                            : ''}
                        </option>
                      ))}
                  </select>
                </label>
                {describeRankingChangeLines(comparedSummary).length > 0 && (
                  <span className="text-white/70">
                    {describeRankingChangeLines(comparedSummary).join(' · ')}
                  </span>
                )}
              </div>

              {dropped.length > 0 && (
                <div className="mt-2 text-xs text-white/50">
                  Not on this version: {dropped.map((qb) => qb.name).join(', ')}
                </div>
              )}
            </div>

            <div className="p-3">
              <HistoryBoard
                key={selected.id}
                initialOpenId={params.get('qb')}
                entry={selected}
                movement={movement}
                history={entries}
                showMovement={!!compareTo}
              />
            </div>
          </section>
        </div>
      )}

      {exporting && selected && (
        <RankingsExportModal
          rankings={selected.rankings || []}
          rankingName={`QB Rankings ${
            selected.kind === 'current'
              ? formatRankingDate(selected)
              : formatArchiveDate(selected)
          }`}
          title="Export Ranking"
          subtitle={`The board as it stood on ${
            selected.kind === 'current'
              ? formatRankingDate(selected)
              : formatArchiveDate(selected)
          }`}
          onClose={() => setExporting(false)}
        />
      )}
    </div>
  );
};

export default RankingHistoryPage;
