import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRankerContext } from '@/context/RankerContext';
import RankingResults from '@/features/ranker/RankingResults';
import ComparisonMatrixDrawer from '@/features/ranker/ComparisonMatrixDrawer';

const RankerResultsPage = () => {
  const navigate = useNavigate();
  const {
    finalRanking,
    comparisonResults,
    playerPool,
    setCurrentPhase,
    resetRanker,
    setFinalRanking,
  } = useRankerContext();

  useEffect(() => {
    setCurrentPhase('results');

    // Redirect to setup if no results
    if (!finalRanking || finalRanking.length === 0) {
      navigate('/ranker/setup');
    }
  }, [setCurrentPhase, finalRanking, navigate]);

  const handleStartNew = () => {
    resetRanker();
    navigate('/ranker');
  };

  const handleRankingAdjusted = (adjustedRanking) => {
    setFinalRanking(adjustedRanking);
  };

  if (!finalRanking || finalRanking.length === 0) {
    return (
      <div className="bg-neutral-900 min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">No ranking results available</p>
          <button
            onClick={() => navigate('/ranker/setup')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Start New Ranking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Navigation buttons */}
        <div className="flex justify-between items-center mb-6">
          <Link
            to="/ranker/comparisons"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            ← Back to Comparisons
          </Link>
          <button
            onClick={handleStartNew}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors"
          >
            🚀 Start New Ranking
          </button>
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
      </div>
    </div>
  );
};

export default RankerResultsPage;
