import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRankerContext } from '@/context/RankerContext';
import RankingSession from '@/features/ranker/RankingSession';

const RankerComparisonsPage = () => {
  const navigate = useNavigate();
  const {
    playerPool,
    setupData,
    setCurrentPhase,
    setFinalRanking,
    setComparisonResults,
  } = useRankerContext();

  useEffect(() => {
    setCurrentPhase('comparisons');

    // Redirect to setup if either player pool or setup data is missing
    if (!playerPool?.length || !setupData) {
      navigate('/ranker/setup');
    }
  }, [setCurrentPhase, playerPool, setupData, navigate]);

  const handleRankingComplete = (ranking, comparisons) => {
    setFinalRanking(ranking);
    setComparisonResults(comparisons);
    navigate('/ranker/results');
  };

  if (!playerPool?.length || !setupData) {
    return (
      <div className="bg-neutral-900 min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">No players selected for ranking</p>
          <button
            onClick={() => navigate('/ranker/setup')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Go to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 min-h-screen">
      <RankingSession
        playerPool={playerPool}
        setupData={setupData}
        onComplete={handleRankingComplete}
      />
    </div>
  );
};

export default RankerComparisonsPage;
