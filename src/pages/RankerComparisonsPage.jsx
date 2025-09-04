import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRankerContext } from '@/context/RankerContext';
import RankingSession from '@/features/ranker/RankingSession';
import RankerNavBar from '@/components/ranker/RankerNavBar';

const RankerComparisonsPage = () => {
  const navigate = useNavigate();
  const {
    playerPool,
    setupData,
    setCurrentPhase,
    setFinalRanking,
    setComparisonResults,
    canNavigateToStep,
    generateShareableURL,
  } = useRankerContext();

  const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);

  useEffect(() => {
    setCurrentPhase('comparisons');

    // Show recovery options if missing prerequisites, but don't auto-redirect
    if (!playerPool?.length || !setupData) {
      setShowRecoveryOptions(true);
    }
  }, [setCurrentPhase, playerPool, setupData]);

  const handleRankingComplete = (ranking, comparisons) => {
    setFinalRanking(ranking);
    setComparisonResults(comparisons);
    navigate('/ranker/results');
  };

  const handleShareSession = () => {
    const shareUrl = generateShareableURL('/ranker/comparisons');
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(
        'Session URL copied to clipboard! Others can continue this ranking session with this link.'
      );
    });
  };

  // Recovery UI when prerequisites are missing
  if (showRecoveryOptions && (!playerPool?.length || !setupData)) {
    return (
      <div className="bg-neutral-900 min-h-screen text-white">
        <RankerNavBar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-4">
                Setup Required
              </h1>
              <p className="text-white/60 text-lg mb-8">
                {!playerPool?.length && !setupData
                  ? 'You need to complete the setup first before starting comparisons.'
                  : !playerPool?.length
                    ? 'No players selected for ranking.'
                    : 'Setup configuration is missing.'}
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
                  ⚙️ Go to Setup
                </button>

                {canNavigateToStep('results') && (
                  <button
                    onClick={() => navigate('/ranker/results')}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors"
                  >
                    📊 View Previous Results
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
      <RankingSession
        playerPool={playerPool}
        setupData={setupData}
        onComplete={handleRankingComplete}
      />
    </div>
  );
};

export default RankerComparisonsPage;
