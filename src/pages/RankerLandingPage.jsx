import React from 'react';
import { Link } from 'react-router-dom';
import { useRankerContext } from '@/context/RankerContext';

const RankerLandingPage = () => {
  const {
    playerPool,
    setupData,
    finalRanking,
    canNavigateToStep,
    resetRanker,
  } = useRankerContext();

  const hasSession =
    playerPool.length > 0 || setupData || finalRanking.length > 0;

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-start pt-48 px-6 relative overflow-hidden">
      {/* Decorative Jameis images across the page */}
      <div className="absolute left-0 right-0 top-0 flex justify-center gap-8 py-4 z-0 pointer-events-none">
        {[1, 2, 3, 4, 5].map((num) => (
          <img
            key={num}
            src={`/assets/qb-photos/jameis-${num}.png`}
            alt={`Jameis ${num}`}
            className="w-48 h-48 object-contain rounded-lg opacity-40"
          />
        ))}
      </div>

      {/* QB icon */}
      <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-gray-700 to-teal-400 bg-clip-text text-transparent z-10">
        QB Ranker
      </h1>
      <p className="text-lg text-white/80 mb-12 text-center z-10 max-w-2xl">
        Build your custom QB rankings through head-to-head comparisons with our
        smart algorithm. Each step is saved and navigable - never lose your
        progress again.
      </p>

      <img
        src="/assets/headshots/jameis-winston.png"
        alt="QB Icon"
        className="w-20 h-20 -mb-8 z-10"
      />

      {/* Session Status */}
      {hasSession && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8 z-10 max-w-2xl w-full">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            🔄 Continue Your Session
          </h2>

          <div className="grid gap-3 mb-4">
            {canNavigateToStep('results') && (
              <Link
                to="/ranker/results"
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors text-center block"
              >
                📊 View Your Results
              </Link>
            )}

            {canNavigateToStep('comparisons') && (
              <Link
                to="/ranker/comparisons"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors text-center block"
              >
                ↩️ Continue Comparisons
              </Link>
            )}

            <Link
              to="/ranker/setup"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors text-center block"
            >
              ⚙️ Review Setup
            </Link>
          </div>

          <div className="text-center">
            <button
              onClick={resetRanker}
              className="text-white/60 hover:text-white text-sm underline transition-colors"
            >
              Start Fresh Session
            </button>
          </div>
        </div>
      )}

      {/* Main Action */}
      <Link
        to="/ranker/setup"
        className="inline-block px-8 py-4 bg-gradient-to-r from-gray-700 to-teal-600 hover:from-gray-600 hover:to-teal-500 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg z-10 mb-4"
      >
        🚀 {hasSession ? 'New Ranking Session' : 'Launch Ranker'}
      </Link>

      {/* Quick Navigation */}
      <div className="flex gap-4 z-10">
        <Link
          to="/ranker/setup"
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          Setup
        </Link>
        <span className="text-white/30">•</span>
        <Link
          to="/ranker/comparisons"
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          Comparisons
        </Link>
        <span className="text-white/30">•</span>
        <Link
          to="/ranker/results"
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          Results
        </Link>
      </div>

      {/* Divider */}
      <div className="w-full max-w-md mt-10 border-t border-teal-700 opacity-40 z-10" />
    </div>
  );
};

export default RankerLandingPage;
