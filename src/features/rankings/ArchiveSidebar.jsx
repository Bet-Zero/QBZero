import React from 'react';
import PropTypes from 'prop-types';
import { Clock, Eye, RotateCcw, Trash2 } from 'lucide-react';
import { formatRankingDate } from '@/utils/formatting/rankingDates';
import { describeRankingChange } from '@/utils/rankings/rankingSummary';

/**
 * The list of saved archives.
 *
 * Lifted out of QBRankingsHome and BrowseRankingsPage, which carried it -- and
 * the panel beside it -- as two byte-identical copies. Restore and delete are
 * new: the archive used to be write-only, with the one "Load This Version"
 * button sitting in a component nothing imported.
 */
const ArchiveSidebar = ({
  archives,
  selectedId,
  onSelect,
  onRestore,
  onDelete,
  busyId,
}) => (
  <div className="bg-neutral-800/50 rounded-xl p-6 border border-white/10 mb-6">
    <div className="flex items-center gap-3 mb-4">
      <Clock size={20} className="text-blue-400" />
      <h3 className="text-lg font-bold text-white">
        Personal Rankings History
      </h3>
      {selectedId && (
        <span className="text-blue-400 text-xs bg-blue-600/20 px-2 py-1 rounded-full">
          Archive Selected
        </span>
      )}
    </div>

    {archives.length > 0 ? (
      <div className="space-y-2 max-h-96 overflow-y-auto overflow-x-hidden archive-scrollbar">
        {archives.map((archive) => {
          const isSelected = selectedId === archive.id;
          const isBusy = busyId === archive.id;

          return (
            <div
              key={archive.id}
              className={`rounded-lg border transition-all ${
                isSelected
                  ? 'bg-blue-600/30 border-blue-400/70 shadow-lg'
                  : 'bg-white/5 border-white/10 hover:bg-white/15'
              }`}
            >
              <button
                type="button"
                aria-pressed={isSelected}
                className="w-full text-left p-3 cursor-pointer"
                onClick={() => onSelect(archive)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium text-sm">
                      {formatRankingDate(archive, { withTime: true })}
                    </div>
                    <div className="text-white/60 text-xs">
                      {archive.rankings?.length || 0} QBs ranked
                    </div>
                    {describeRankingChange(archive.summary) && (
                      <div className="text-white/50 text-[11px] mt-0.5">
                        {describeRankingChange(archive.summary)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    )}
                    <Eye size={16} className="text-white/40" />
                  </div>
                </div>
                {archive.notes && (
                  <div className="text-white/70 text-xs mt-1 italic">
                    {archive.notes.length > 50
                      ? `${archive.notes.substring(0, 50)}...`
                      : archive.notes}
                  </div>
                )}
                <div className="text-blue-400/60 text-xs mt-1 font-medium">
                  {isSelected ? 'Viewing archive' : 'Click to view →'}
                </div>
              </button>

              {(onRestore || onDelete) && (
                <div className="flex items-center gap-2 px-3 pb-3">
                  {onRestore && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onRestore(archive)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white/80 text-xs transition-colors"
                      title="Make this the current ranking"
                    >
                      <RotateCcw size={12} />
                      {isBusy ? 'Restoring…' : 'Restore'}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onDelete(archive)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-red-600/20 hover:bg-red-600/40 disabled:opacity-40 text-red-300 text-xs transition-colors"
                      title="Delete this archive"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    ) : (
      <div className="text-center py-4 text-white/60 text-sm">
        No archives yet. Your rankings are saved to the history each time you
        save a change.
      </div>
    )}
  </div>
);

ArchiveSidebar.propTypes = {
  archives: PropTypes.array.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onRestore: PropTypes.func,
  onDelete: PropTypes.func,
  busyId: PropTypes.string,
};

export default ArchiveSidebar;
