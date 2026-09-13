import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Clock, Users } from 'lucide-react';
import QBRankingCard from '@/features/rankings/QBRankingCard';
import RankingsExportModal from '@/components/shared/RankingsExportModal';
import { formatRankingDate } from '@/utils/formatting/rankingDates';
import { describeRankingChange } from '@/utils/rankings/rankingSummary';

/**
 * The main panel on the two history pages: either the live board's top ten, or
 * the archive the reader picked from the sidebar.
 *
 * QBRankingsHome and BrowseRankingsPage each carried their own copy of this,
 * identical line for line, which is why a fix to either had to be made twice.
 */
const PersonalRankingPanel = ({
  current,
  selectedArchive,
  onClearSelection,
  onEdit,
  onRestore,
  isRestoring,
}) => {
  // A archive could be viewed but not exported, which is most of what a
  // archive is for -- showing what the board looked like at the time.
  const [exportingArchive, setExportingArchive] = useState(false);

  if (selectedArchive) {
    return (
      <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/10 border border-blue-500/30 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <Clock size={24} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Archive from{' '}
              {formatRankingDate(selectedArchive, { withTime: true })}
            </h2>
            <p className="text-blue-300/80 text-sm">
              {selectedArchive.rankings?.length || 0} QBs ranked
              {selectedArchive.notes && <> • {selectedArchive.notes}</>}
            </p>
            {describeRankingChange(selectedArchive.summary) && (
              <p className="text-blue-300/60 text-xs mt-0.5">
                {describeRankingChange(selectedArchive.summary)}
              </p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setExportingArchive(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Export
            </button>
            {onRestore && (
              <button
                onClick={() => onRestore(selectedArchive)}
                disabled={isRestoring}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isRestoring ? 'Restoring…' : 'Restore This Version'}
              </button>
            )}
            <button
              onClick={onClearSelection}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Back to Current
            </button>
          </div>
        </div>

        {exportingArchive && (
          <RankingsExportModal
            rankings={selectedArchive.rankings || []}
            rankingName={`QB Rankings ${formatRankingDate(selectedArchive)}`}
            title="Export Archive"
            subtitle={`The board as it stood on ${formatRankingDate(selectedArchive)}`}
            onClose={() => setExportingArchive(false)}
          />
        )}

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {selectedArchive.rankings?.length ? (
            selectedArchive.rankings.map((qb, index) => (
              <QBRankingCard
                key={qb.id}
                qb={{ ...qb, rank: index + 1 }}
                readOnly={true}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                onRemove={() => {}}
                onEditNotes={() => {}}
                canMoveUp={false}
                canMoveDown={false}
                isArchiveMode={true}
              />
            ))
          ) : (
            <div className="text-center py-8 text-white/60">
              No rankings found in this archive
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-900/20 to-green-800/10 border border-green-500/30 rounded-xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="p-2 bg-green-600/20 rounded-lg">
          <Users size={24} className="text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            Current Personal Rankings
          </h2>
          <p className="text-green-300/80 text-sm">
            Your most up-to-date QB rankings
            {current && <> • saved {formatRankingDate(current)}</>}
          </p>
        </div>
        <button
          onClick={onEdit}
          className="ml-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          View &amp; Edit
        </button>
      </div>

      {current?.rankings?.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {current.rankings.slice(0, 10).map((qb, index) => (
            <div
              key={qb.id}
              className="bg-white/5 rounded-lg p-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 flex items-center justify-center bg-green-600/20 rounded-full font-bold text-green-400">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-white">{qb.name}</div>
                {qb.team && (
                  <div className="text-white/60 text-sm">{qb.team}</div>
                )}
              </div>
            </div>
          ))}
          {current.rankings.length > 10 && (
            <div className="text-center py-2">
              <span className="text-white/60 text-sm">
                ... and {current.rankings.length - 10} more
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-white/60">
          <p>No current rankings yet</p>
          <button
            onClick={onEdit}
            className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
          >
            Create Your Personal Rankings
          </button>
        </div>
      )}
    </div>
  );
};

PersonalRankingPanel.propTypes = {
  current: PropTypes.object,
  selectedArchive: PropTypes.object,
  onClearSelection: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onRestore: PropTypes.func,
  isRestoring: PropTypes.bool,
};

export default PersonalRankingPanel;
