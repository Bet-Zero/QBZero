import React from 'react';
import { Link } from 'react-router-dom';

const RankerLandingPage = () => {
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
      <p className="text-lg text-white/80 mb-24 text-center z-10">
        Build your custom QB rankings through head-to-head comparisons with our
        smart algorithm.
      </p>
      <img
        src="/assets/headshots/jameis-winston.png"
        alt="QB Icon"
        className="w-20 h-20 -mb-1 z-10"
      />
      <Link
        to="/ranker/setup"
        className="inline-block px-8 py-4 bg-gradient-to-r from-gray-700 to-teal-600 hover:from-gray-600 hover:to-teal-500 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg z-10"
      >
        🚀 Launch Ranker
      </Link>
      {/* Divider */}
      <div className="w-full max-w-md my-10 border-t border-teal-700 opacity-40 z-10" />
      {/* How it works feature list */}
      <div className="max-w-md w-full flex flex-col gap-4 z-10">
        <h2 className="text-xl font-semibold text-teal-300 mb-2 text-center">
          How it works
        </h2>
        <ul className="space-y-2 text-white/70 text-base">
          <li>1. Compare QBs head-to-head</li>
          <li>2. Let the algorithm sort your rankings</li>
          <li>3. Save and share your custom list</li>
        </ul>
      </div>
    </div>
  );
};

export default RankerLandingPage;
