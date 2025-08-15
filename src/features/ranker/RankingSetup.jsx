import React, { useState, useRef, useEffect } from 'react';
import { InformationCircleIcon } from '@heroicons/react/20/solid';

const PlayerButton = ({ player, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2 sm:px-3 py-1 sm:py-2 rounded border text-xs sm:text-sm text-white transition-colors ${
      selected
        ? 'bg-blue-600 border-blue-400'
        : 'bg-white/10 border-white/20 hover:bg-white/20'
    }`}
  >
    {player.display_name || player.name}
  </button>
);

const HelperIcon = ({ text }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);

  const handleToggle = () => {
    setIsVisible(!isVisible);
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible]);

  return (
    <div className="relative ml-1 inline-block" ref={tooltipRef}>
      <InformationCircleIcon
        className="w-4 h-4 text-white/60 cursor-pointer transition-colors hover:text-white/80"
        onClick={handleToggle}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      />
      {isVisible && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 rounded bg-black/90 p-3 text-xs text-white z-20 shadow-lg border border-white/10">
          <div className="text-center">{text}</div>
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black/90"></div>
        </div>
      )}
    </div>
  );
};

export const RankingSetup = ({ playerPool = [], onComplete }) => {
  const [topTier, setTopTier] = useState([]);
  const [bottomTier, setBottomTier] = useState([]);
  const [anchor, setAnchor] = useState(null);
  const [firstPlace, setFirstPlace] = useState(null);
  const [lastPlace, setLastPlace] = useState(null);
  const tierCountEstimate = Math.max(1, Math.round(playerPool.length * 0.25));

  const toggleMulti = (id, list, setter) => {
    setter((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id].slice(0, tierCountEstimate)
    );
  };

  const handleReady = () => {
    onComplete({ topTier, bottomTier, anchor, firstPlace, lastPlace });
  };

  return (
    <div className="text-white p-4 max-w-[700px] mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center sm:text-left">
        Pre-Ranking Setup
      </h2>

      {/* Top Tier Section */}
      <div
        className="mb-8 p-6 bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-500/30 rounded-lg"
        data-testid="top-tier"
      >
        <h3 className="font-semibold mb-3 flex items-center text-sm sm:text-base text-green-300">
          <span className="mr-2">🏆</span>
          Top Tier Selector (~{tierCountEstimate} players)
          <HelperIcon
            text={`Select players you know will finish in the top 25% (~${tierCountEstimate} players)`}
          />
        </h3>
        <div className="flex flex-wrap gap-2">
          {playerPool.map((p) => (
            <PlayerButton
              key={`top-${p.id}`}
              player={p}
              selected={topTier.includes(p.id)}
              onClick={() => toggleMulti(p.id, topTier, setTopTier)}
            />
          ))}
        </div>
      </div>

      {/* Visual Divider */}
      <div className="flex items-center my-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="px-4 text-white/40 text-sm font-medium">vs</div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>

      {/* Bottom Tier Section */}
      <div
        className="mb-8 p-6 bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-500/30 rounded-lg"
        data-testid="bottom-tier"
      >
        <h3 className="font-semibold mb-3 flex items-center text-sm sm:text-base text-red-300">
          <span className="mr-2">📉</span>
          Bottom Tier Selector (~{tierCountEstimate} players)
          <HelperIcon
            text={`Select players you know will finish in the bottom 25% (~${tierCountEstimate} players)`}
          />
        </h3>
        <div className="flex flex-wrap gap-2">
          {playerPool.map((p) => (
            <PlayerButton
              key={`bottom-${p.id}`}
              player={p}
              selected={bottomTier.includes(p.id)}
              onClick={() => toggleMulti(p.id, bottomTier, setBottomTier)}
            />
          ))}
        </div>
      </div>

      {/* Anchor Selection - Now as Dropdown */}
      <div
        className="mb-8 p-6 bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/30 rounded-lg"
        data-testid="anchor"
      >
        <h3 className="font-semibold mb-3 flex items-center text-sm sm:text-base text-blue-300">
          <span className="mr-2">⚓</span>
          Anchor Selector
          <HelperIcon text="Select a player you believe will finish around the middle (50%)" />
        </h3>
        <select
          value={anchor || ''}
          onChange={(e) => setAnchor(e.target.value || null)}
          className="w-full bg-[#1a1a1a] text-white text-sm px-3 py-2 rounded border border-white/10"
        >
          <option value="">No anchor player selected</option>
          {playerPool.map((p) => (
            <option key={`anchor-${p.id}`} value={p.id}>
              {p.display_name || p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lock-In Section */}
      <div className="mb-8 p-6 bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-500/30 rounded-lg">
        <h3 className="font-semibold mb-4 text-sm sm:text-base text-purple-300">
          <span className="mr-2">🔒</span>
          Position Lock-Ins (Optional)
        </h3>
        <div
          className="flex flex-col sm:flex-row gap-4 sm:gap-8"
          data-testid="locks"
        >
          <div className="flex-1">
            <label className="block font-medium mb-2 text-sm text-white/80">
              1st Place Lock-In
            </label>
            <select
              value={firstPlace || ''}
              onChange={(e) => setFirstPlace(e.target.value || null)}
              className="w-full bg-[#1a1a1a] text-white text-sm px-3 py-2 rounded border border-white/10"
            >
              <option value="">None</option>
              {playerPool.map((p) => (
                <option key={`first-${p.id}`} value={p.id}>
                  {p.display_name || p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block font-medium mb-2 text-sm text-white/80">
              Last Place Lock-In
            </label>
            <select
              value={lastPlace || ''}
              onChange={(e) => setLastPlace(e.target.value || null)}
              className="w-full bg-[#1a1a1a] text-white text-sm px-3 py-2 rounded border border-white/10"
            >
              <option value="">None</option>
              {playerPool.map((p) => (
                <option key={`last-${p.id}`} value={p.id}>
                  {p.display_name || p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="text-center">
        <button
          onClick={handleReady}
          className="px-8 py-3 rounded-lg bg-green-600 hover:bg-green-700 transition-colors text-white font-semibold text-lg shadow-lg"
        >
          Go
        </button>
      </div>
    </div>
  );
};

export default RankingSetup;
