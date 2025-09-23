import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRankerContext } from '@/context/RankerContext';
import RankingResults from '@/features/ranker/RankingResults';
import ComparisonMatrixDrawer from '@/features/ranker/ComparisonMatrixDrawer';
import RankerNavBar from '@/components/ranker/RankerNavBar';
import RankingsExportModal from '@/components/shared/RankingsExportModal';

const RankerResultsPage = () => {
  const navigate = useNavigate();
  const {
    finalRanking,
    comparisonResults,
    playerPool,
    setCurrentPhase,
    resetRanker,
    setFinalRanking,
    generateShareableURL,
    canNavigateToStep,
  } = useRankerContext();

  const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    setCurrentPhase('results');

    // Show recovery options if no results, but don't auto-redirect
    if (!finalRanking || finalRanking.length === 0) {
      setShowRecoveryOptions(true);
    }
  }, [setCurrentPhase, finalRanking]);

  const handleStartNew = () => {
    resetRanker();
    navigate('/ranker');
  };

  const handleRankingAdjusted = (adjustedRanking) => {
    setFinalRanking(adjustedRanking);
  };

  const handleShareResults = () => {
    const shareUrl = generateShareableURL('/ranker/results');
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(
        'Results URL copied to clipboard! Anyone can view your results with this link.'
      );
    });
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
                It looks like you haven't completed a ranking session yet, or
                your results were cleared.
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

  return (
    <div className="bg-neutral-900 min-h-screen">
      <RankerNavBar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Action buttons */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div className="flex gap-3">
            <button
              onClick={handleShareResults}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors"
            >
              🔗 Share Results
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
            >
              📤 Export Rankings
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleStartNew}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors"
            >
              🚀 Start New Ranking
            </button>
          </div>
        </div>

        {/* Results */}
        <RankingResults
          ranking={finalRanking}
          onRankingAdjusted={handleRankingAdjusted}
        />

        <div className="text-white/30 mt-8 text-center text-sm italic px-4">
          Ranking created on{' '}
          {new Date().toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>

        {/* Comparison Matrix */}
        {comparisonResults && playerPool && (
          <ComparisonMatrixDrawer
            players={playerPool}
            comparisons={comparisonResults}
          />
        )}

        {/* Export Modal */}
        {showExportModal && (
          <RankingsExportModal
            rankings={finalRanking}
            rankingName="QB Rankings from Ranker"
            onClose={() => setShowExportModal(false)}
            title="Export Ranker Results"
            subtitle="Export your ranking results in different formats"
          />
        )}
      </div>
    </div>
  );
};

export default RankerResultsPage;
