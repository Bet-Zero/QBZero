import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRankerContext } from '@/context/RankerContext';
import ComparisonMatrixDrawer from '@/features/ranker/ComparisonMatrixDrawer';
import RankerNavBar from '@/components/ranker/RankerNavBar';
import RankingsExportModal from '@/components/shared/RankingsExportModal';
import { detectComparisonCycles } from '@/utils/ranker/rankingEngine';
import { RankingBoard } from '@/components/shared/rankings/RankingViews';
import AdjustableRankings from '@/features/ranker/AdjustableRankings';
import useAuth from '@/hooks/useAuth';
import {
  getCurrentPersonalRanking,
  saveCurrentPersonalRankings,
} from '@/firebase/personalRankingHelpers';
import {
  toRosterEntry,
  withRanks,
} from '@/utils/rankings/personalRankingEntries';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';

const ActionButton = ({ onClick, to, className, children, disabled }) => {
  const shared = `px-4 py-2 rounded-lg text-white font-semibold transition-colors ${className}`;
  return to ? (
    <Link to={to} className={`${shared} inline-block`}>
      {children}
    </Link>
  ) : (
    <button onClick={onClick} className={shared} disabled={disabled}>
      {children}
    </button>
  );
};

ActionButton.propTypes = {
  onClick: PropTypes.func,
  to: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
  disabled: PropTypes.bool,
};

const RankerResultsPage = () => {
  const navigate = useNavigate();
  const {
    finalRanking,
    comparisonResults,
    playerPool,
    resetRanker,
    setFinalRanking,
    generateShareableURL,
    canNavigateToStep,
  } = useRankerContext();

  const { isAdmin } = useAuth();
  const [isSavingToBoard, setIsSavingToBoard] = useState(false);
  const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);
  // The rankings render on the page now; the modal is for exporting.
  const [showExportModal, setShowExportModal] = useState(false);
  const [viewType, setViewType] = useState('grid');
  const [showLogoBg, setShowLogoBg] = useState(true);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Contradictory comparisons (a > b > c > a) make the order of the players
  // involved arbitrary. The ranking is still shown, but saying so is more
  // honest than presenting a coin flip as a considered result.
  const conflicts = useMemo(() => {
    if (!comparisonResults?.length || !playerPool?.length) return [];
    const nameById = new Map(
      playerPool.map((p) => [p.id, p.display_name || p.name || p.id])
    );
    return detectComparisonCycles(comparisonResults, playerPool).map((cycle) =>
      cycle.map((id) => nameById.get(id) || id)
    );
  }, [comparisonResults, playerPool]);

  useEffect(() => {
    // Show recovery options if no results, but don't auto-redirect
    if (!finalRanking || finalRanking.length === 0) {
      setShowRecoveryOptions(true);
    }
  }, [finalRanking]);

  const handleStartNew = () => {
    resetRanker();
    navigate('/ranker');
  };

  const handleRankingAdjusted = (adjustedRanking) => {
    setFinalRanking(adjustedRanking);
  };

  /**
   * Put this ordering on the personal rankings board.
   *
   * The ranker works out an order by asking about pairs, and until now that
   * order died here -- exportable as an image, but only reproducible on the
   * board by dragging thirty quarterbacks into place by hand. The pool is the
   * curated roster, so each entry keeps its roster id.
   *
   * This goes through the ordinary save: the board being replaced is archived
   * first, so it is recoverable from the history page, and the notes already
   * written against a quarterback follow him into the new order rather than
   * being thrown away with it.
   */
  const handleSaveToPersonalRankings = async () => {
    if (
      !window.confirm(
        `Replace your personal rankings with these ${finalRanking.length} quarterbacks? Your current board is archived first, so this can be undone.`
      )
    ) {
      return;
    }

    setIsSavingToBoard(true);
    try {
      const existing = await getCurrentPersonalRanking();
      const notesById = new Map(
        (existing?.rankings || []).map((entry) => [entry.id, entry.notes])
      );

      const entries = withRanks(
        finalRanking.map((item) => {
          const player = item?.qb || item?.player || item;
          const entry = toRosterEntry({
            id: player.id,
            name: player.display_name || player.name,
            team: player.team || player.bio?.Team || '',
          });
          return { ...entry, notes: notesById.get(entry.id) || '' };
        })
      );

      await saveCurrentPersonalRankings(entries, {
        notes: 'Set from a QB Ranker session',
      });
      toast.success('Saved to your personal rankings.');
      navigate('/rankings/edit');
    } catch (error) {
      console.error('Could not save the ranker results:', error);
      toast.error('Could not save these to your rankings.');
    } finally {
      setIsSavingToBoard(false);
    }
  };

  const handleShareResults = async () => {
    const { url, error } = generateShareableURL('/ranker/results');
    if (error) {
      alert(error);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      alert(
        'Results URL copied to clipboard! Anyone can view your results with this link.'
      );
    } catch {
      alert(`Could not copy automatically. Here is the link:\n\n${url}`);
    }
  };

  // Recovery UI when no results are available
  if (showRecoveryOptions && (!finalRanking || finalRanking.length === 0)) {
    return (
      <div className="bg-neutral-900 min-h-screen text-white">
        <RankerNavBar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-4">
                No Results Available
              </h1>
              <p className="text-white/60 text-lg mb-8">
                It looks like you haven&apos;t completed a ranking session yet,
                or your results were cleared.
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-8 border border-white/10 max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-white mb-4">
                What would you like to do?
              </h2>

              <div className="grid gap-4">
                <button
                  onClick={() => navigate('/ranker/setup')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
                >
                  🚀 Start New Ranking
                </button>

                {canNavigateToStep('comparisons') && (
                  <button
                    onClick={() => navigate('/ranker/comparisons')}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors"
                  >
                    ↩️ Continue Previous Session
                  </button>
                )}

                <Link
                  to="/ranker"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-semibold transition-colors block text-center"
                >
                  ← Back to Ranker Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAdjusting) {
    return (
      <div className="bg-neutral-900 min-h-screen">
        <RankerNavBar />
        <AdjustableRankings
          initialRanking={finalRanking}
          onSave={(adjusted) => {
            setFinalRanking(adjusted);
            setIsAdjusting(false);
          }}
          onCancel={() => setIsAdjusting(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 min-h-screen">
      <RankerNavBar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {conflicts.length > 0 && (
          <div
            className="mb-6 p-4 bg-amber-500/10 border border-amber-400/40 rounded-lg"
            role="status"
          >
            <h2 className="text-amber-200 font-semibold mb-1 text-sm">
              ⚠️ Some of your picks contradict each other
            </h2>
            <p className="text-amber-100/70 text-sm mb-2">
              These players beat each other in a loop, so their order here is
              arbitrary. Adjust them by hand if the result looks wrong.
            </p>
            <ul className="text-amber-100/80 text-sm list-disc list-inside">
              {conflicts.map((cycle) => (
                <li key={cycle.join('|')}>
                  {cycle.join(' → ')} → {cycle[0]}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-[0.04em] text-white">
            Your QB Rankings
          </h1>
          <div className="mt-2 text-white/60 text-sm">
            {finalRanking.length} quarterbacks ranked
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <ActionButton
            onClick={() => setIsAdjusting(true)}
            className="bg-orange-600/80 hover:bg-orange-700"
          >
            ✏️ Adjust Rankings
          </ActionButton>
          <ActionButton
            onClick={() => setShowExportModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            📥 Export
          </ActionButton>
          <ActionButton
            onClick={handleShareResults}
            className="bg-purple-600 hover:bg-purple-700"
          >
            🔗 Share Results
          </ActionButton>
          <button
            onClick={() => setViewType(viewType === 'grid' ? 'list' : 'grid')}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
          >
            {viewType === 'grid' ? '☰ List View' : '▦ Grid View'}
          </button>
          {viewType === 'grid' && (
            <button
              onClick={() => setShowLogoBg(!showLogoBg)}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              {showLogoBg ? 'Hide Logo BG' : 'Show Logo BG'}
            </button>
          )}
          {isAdmin && finalRanking.length > 0 && (
            <ActionButton
              onClick={handleSaveToPersonalRankings}
              disabled={isSavingToBoard}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSavingToBoard ? 'Saving…' : '⭐ Save to My Rankings'}
            </ActionButton>
          )}
          <div className="sm:ml-auto">
            <ActionButton
              onClick={handleStartNew}
              className="bg-green-600 hover:bg-green-700"
            >
              🚀 Start New Ranking
            </ActionButton>
          </div>
        </div>

        {/* The rankings themselves */}
        <RankingBoard
          rankings={finalRanking}
          viewType={viewType}
          showLogoBg={showLogoBg}
        />

        {/* Comparison Matrix */}
        {comparisonResults && playerPool && (
          <ComparisonMatrixDrawer
            players={playerPool}
            comparisons={comparisonResults}
          />
        )}

        {/* Export Modal, opened on demand */}
        {showExportModal && (
          <RankingsExportModal
            rankings={finalRanking}
            rankingName="QB Rankings from Ranker"
            onClose={() => setShowExportModal(false)}
            title="Export Rankings"
            subtitle="Download your rankings as an image"
            onRankingAdjusted={handleRankingAdjusted}
          />
        )}
      </div>
    </div>
  );
};

export default RankerResultsPage;
