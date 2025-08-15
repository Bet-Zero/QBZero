import React from 'react';
import { Link } from 'react-router-dom';

const RankerLandingPage = () => {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-start py-16 px-6 relative overflow-hidden">
      {/* Animated gradient background circles */}
      <div
        className="absolute top-0 left-0 w-96 h-96 bg-teal-500 opacity-20 rounded-full blur-3xl animate-slow-pulse"
        style={{ zIndex: 0 }}
      />
      <div
        className="absolute bottom-0 right-0 w-72 h-72 bg-gray-700 opacity-20 rounded-full blur-2xl"
        style={{ zIndex: 0 }}
      />
      {/* QB icon */}
      <img
        src="/assets/logos/qb-icon.svg"
        alt="QB Icon"
        className="w-20 h-20 mb-4 z-10"
      />
      <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-gray-700 to-teal-400 bg-clip-text text-transparent z-10">
        QB Ranker
      </h1>
      <p className="text-lg text-white/80 mb-44 text-center z-10">
        Build your custom QB rankings through head-to-head comparisons with our
        smart algorithm.
      </p>
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
          <li>2. Let our algorithm sort your rankings</li>
          <li>3. Save and share your custom list</li>
        </ul>
      </div>
    </div>
  );
};

export default RankerLandingPage;
