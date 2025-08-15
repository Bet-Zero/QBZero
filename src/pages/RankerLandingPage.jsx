import React from 'react';
import { Link } from 'react-router-dom';

const RankerLandingPage = () => {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            QB Ranker
          </h1>
          <p className="text-xl sm:text-2xl text-white/80 mb-6">
            Create the definitive quarterback rankings
          </p>
          <p className="text-lg text-white/60 leading-relaxed">
            Build your custom QB rankings through head-to-head comparisons. Our
            smart algorithm minimizes the number of decisions needed while
            ensuring accurate results.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/ranker/setup"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            🚀 Start Ranking
          </Link>

          <div className="text-sm text-white/50 mt-6">
            <p>• Pre-select your top and bottom tier players</p>
            <p>• Set anchor points for more accurate rankings</p>
            <p>• Make head-to-head comparisons</p>
            <p>• Export your final rankings</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankerLandingPage;
