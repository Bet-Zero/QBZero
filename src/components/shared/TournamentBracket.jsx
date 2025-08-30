import React, { useState, useEffect } from 'react';

const TournamentBracket = ({ bracket = [], selectWinner, roundNames = [] }) => {
  const [showCompactView, setShowCompactView] = useState(false);
  const [currentRegion, setCurrentRegion] = useState(0);
  const [showRegionView, setShowRegionView] = useState(false); // Start with full bracket view
  const [isAdvancing, setIsAdvancing] = useState(false); // New state for advance animation
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState(null); // Track the timer
  const [roundViewStart, setRoundViewStart] = useState(0);
  const [viewMode, setViewMode] = useState('adaptive'); // 'adaptive' or 'overview'

  // Group matches by round
  const getMatchesByRound = () => {
    const rounds = {};
    bracket.forEach((match) => {
      if (!rounds[match.round]) {
        rounds[match.round] = [];
      }
      rounds[match.round].push(match);
    });
    return rounds;
  };

  const roundsData = getMatchesByRound();
  const totalRounds = Object.keys(roundsData).length;

  // Enhanced winner selection with deselection capability
  const handleWinnerSelection = (matchId, selectedQB) => {
    const match = bracket.find((m) => m.id === matchId);
    if (!match) return;

    // If the same QB is clicked and is already the winner, deselect
    if (match.winner && match.winner.id === selectedQB.id) {
      selectWinner(matchId, null); // Deselect by passing null
      return;
    }

    // Otherwise, select the new winner
    selectWinner(matchId, selectedQB);
  };

  // Enhanced bracket layout with region functionality
  const renderSimpleBracket = () => {
    const activeRound = getCurrentActiveRound();
    const totalMatches = roundsData[activeRound]?.length || 0;

    // Use region-based display for large tournaments
    if (totalMatches > 4) {
      return renderRegionBracket();
    }

    // For small tournaments (4 or fewer matches), show full bracket
    const rounds = Object.keys(roundsData)
      .sort((a, b) => Number(a) - Number(b))
      .map(Number);

    const firstRoundMatches = roundsData[0]?.length || 0;
    const containerWidth = rounds.length * 320 + 100;
    const containerHeight = Math.max(600, firstRoundMatches * 200 + 200);

    return (
      <div className="w-full overflow-x-auto overflow-y-auto">
        <div
          className="relative mx-auto"
          style={{
            width: `${containerWidth}px`,
            height: `${containerHeight}px`,
            minHeight: '600px',
            padding: '40px 20px',
          }}
        >
          {/* Round headers */}
          {rounds.map((roundNum, roundIndex) => {
            const matches = roundsData[roundNum] || [];
            return (
              <div
                key={`header-${roundNum}`}
                className="absolute text-center"
                style={{
                  left: `${roundIndex * 320}px`,
                  top: '0px',
                  width: '280px',
                }}
              >
                <h3 className="text-sm font-bold text-white bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg py-2 px-3 border border-white/10">
                  {roundNames[roundNum] || `Round ${roundNum + 1}`}
                </h3>
                <div className="text-xs text-white/50 mt-1">
                  {matches.filter((m) => m.winner).length} / {matches.length}{' '}
                  complete
                </div>
              </div>
            );
          })}

          {/* Bracket connecting lines */}
          {rounds.slice(0, -1).map((roundNum, roundIndex) => {
            const matches = roundsData[roundNum] || [];
            const nextRoundMatches = roundsData[roundNum + 1] || [];
            const lines = [];

            for (let i = 0; i < matches.length; i += 2) {
              const match1Y = getMatchY(roundIndex, i, matches.length);
              const match2Y =
                i + 1 < matches.length
                  ? getMatchY(roundIndex, i + 1, matches.length)
                  : match1Y;
              const nextMatchIndex = Math.floor(i / 2);

              if (nextMatchIndex < nextRoundMatches.length) {
                const nextMatchY = getMatchY(
                  roundIndex + 1,
                  nextMatchIndex,
                  nextRoundMatches.length
                );
                const currentRoundX = roundIndex * 320 + 280;
                const centerX = currentRoundX + 20;

                // Horizontal lines from matches
                lines.push(
                  <div
                    key={`h1-${roundNum}-${i}`}
                    className="absolute bg-white/40 h-0.5"
                    style={{
                      left: `${currentRoundX}px`,
                      top: `${match1Y + 70}px`,
                      width: '20px',
                    }}
                  />
                );

                if (i + 1 < matches.length) {
                  lines.push(
                    <div
                      key={`h2-${roundNum}-${i}`}
                      className="absolute bg-white/40 h-0.5"
                      style={{
                        left: `${currentRoundX}px`,
                        top: `${match2Y + 70}px`,
                        width: '20px',
                      }}
                    />
                  );
                }

                // Vertical connecting line
                if (i + 1 < matches.length && Math.abs(match2Y - match1Y) > 5) {
                  lines.push(
                    <div
                      key={`v-${roundNum}-${i}`}
                      className="absolute bg-white/40 w-0.5"
                      style={{
                        left: `${centerX}px`,
                        top: `${Math.min(match1Y, match2Y) + 70}px`,
                        height: `${Math.abs(match2Y - match1Y)}px`,
                      }}
                    />
                  );
                }

                // Line to next round
                lines.push(
                  <div
                    key={`next-${roundNum}-${i}`}
                    className="absolute bg-white/40 h-0.5"
                    style={{
                      left: `${centerX}px`,
                      top: `${nextMatchY + 70}px`,
                      width: '20px',
                    }}
                  />
                );
              }
            }

            return lines;
          })}

          {/* Match cards */}
          {rounds.map((roundNum, roundIndex) => {
            const matches = roundsData[roundNum] || [];

            return matches.map((match, matchIndex) => {
              const matchY = getMatchY(roundIndex, matchIndex, matches.length);

              return (
                <div
                  key={match.id}
                  className="absolute w-72 bg-neutral-800 rounded-lg border border-white/10 shadow-lg hover:shadow-xl transition-shadow"
                  style={{
                    top: `${matchY}px`,
                    left: `${roundIndex * 320}px`,
                  }}
                >
                  <div className="p-3 space-y-2">
                    {/* QB 1 */}
                    <button
                      onClick={() => handleWinnerSelection(match.id, match.qb1)}
                      disabled={match.qb1.id === 'bye'}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-sm relative ${
                        match.winner?.id === match.qb1.id
                          ? 'border-green-500 bg-green-500/20 text-green-300 hover:border-red-400 hover:bg-red-400/10'
                          : match.qb1.id === 'bye'
                            ? 'border-gray-500 bg-gray-500/20 cursor-not-allowed'
                            : 'border-white/20 hover:border-blue-400 hover:bg-blue-400/10 cursor-pointer'
                      }`}
                      title={
                        match.winner?.id === match.qb1.id
                          ? 'Click to deselect'
                          : ''
                      }
                    >
                      <div className="font-semibold truncate">
                        {match.qb1.name}
                      </div>
                      <div className="text-xs text-white/60">
                        {match.qb1.team}
                      </div>
                      {match.winner?.id === match.qb1.id && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-lg">
                          ✓
                        </div>
                      )}
                    </button>

                    <div className="text-center text-white/40 text-xs font-bold py-1">
                      VS
                    </div>

                    {/* QB 2 */}
                    <button
                      onClick={() => handleWinnerSelection(match.id, match.qb2)}
                      disabled={match.qb2.id === 'bye'}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-sm relative ${
                        match.winner?.id === match.qb2.id
                          ? 'border-green-500 bg-green-500/20 text-green-300 hover:border-red-400 hover:bg-red-400/10'
                          : match.qb2.id === 'bye'
                            ? 'border-gray-500 bg-gray-500/20 cursor-not-allowed'
                            : 'border-white/20 hover:border-blue-400 hover:bg-blue-400/10 cursor-pointer'
                      }`}
                      title={
                        match.winner?.id === match.qb2.id
                          ? 'Click to deselect'
                          : ''
                      }
                    >
                      <div className="font-semibold truncate">
                        {match.qb2.name}
                      </div>
                      <div className="text-xs text-white/60">
                        {match.qb2.team}
                      </div>
                      {match.winner?.id === match.qb2.id && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-lg">
                          ✓
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              );
            });
          })}
        </div>
      </div>
    );
  };

  // Enhanced bracket layout that scales to fit screen
  const renderScaledBracket = () => {
    const rounds = Object.keys(roundsData)
      .sort((a, b) => Number(a) - Number(b))
      .map(Number);

    if (rounds.length === 0) return null;

    // Much more reasonable scaling - prioritize readability
    const minCardWidth = 200; // Minimum readable width
    const minCardHeight = 100; // Minimum readable height
    const baseSpacing = 120; // Tighter but readable spacing

    const maxScreenWidth =
      typeof window !== 'undefined' ? window.innerWidth - 100 : 1200;
    const maxScreenHeight =
      typeof window !== 'undefined' ? window.innerHeight - 400 : 700;

    // Calculate how many rounds we can reasonably fit
    const maxRoundsToShow = Math.floor(maxScreenWidth / (minCardWidth + 40));
    const roundsToShow = Math.min(rounds.length, maxRoundsToShow, 4); // Max 4 rounds

    // Use the first few rounds or show around active round
    const activeRound = getCurrentActiveRound();
    const startRound = Math.max(
      0,
      Math.min(activeRound - 1, rounds.length - roundsToShow)
    );
    const visibleRounds = rounds.slice(startRound, startRound + roundsToShow);

    const cardWidth = Math.max(
      minCardWidth,
      Math.floor((maxScreenWidth - 100) / roundsToShow) - 40
    );
    const roundSpacing = cardWidth + 40;

    // Calculate height based on first visible round
    const firstRoundMatches = roundsData[visibleRounds[0]]?.length || 0;
    const cardHeight = Math.max(
      minCardHeight,
      Math.min(
        140,
        Math.floor((maxScreenHeight - 200) / Math.max(firstRoundMatches, 8))
      )
    );

    const containerWidth = roundsToShow * roundSpacing;
    const containerHeight = Math.max(
      500,
      firstRoundMatches * baseSpacing + 200
    );

    return (
      <div className="w-full overflow-hidden">
        {/* Round navigation if we can't show all rounds */}
        {rounds.length > roundsToShow && (
          <div className="flex justify-center mb-4 gap-2">
            <button
              onClick={() => setRoundViewStart(Math.max(0, startRound - 1))}
              disabled={startRound === 0}
              className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white text-sm rounded"
            >
              ← Previous Rounds
            </button>
            <span className="px-3 py-1 text-white text-sm">
              Rounds {startRound + 1}-{startRound + roundsToShow} of{' '}
              {rounds.length}
            </span>
            <button
              onClick={() =>
                setRoundViewStart(
                  Math.min(rounds.length - roundsToShow, startRound + 1)
                )
              }
              disabled={startRound + roundsToShow >= rounds.length}
              className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white text-sm rounded"
            >
              Next Rounds →
            </button>
          </div>
        )}

        <div
          className="relative mx-auto"
          style={{
            width: `${containerWidth}px`,
            height: `${containerHeight}px`,
            minHeight: '500px',
            padding: '20px',
          }}
        >
          {/* Round headers */}
          {visibleRounds.map((roundNum, roundIndex) => {
            const matches = roundsData[roundNum] || [];
            return (
              <div
                key={`header-${roundNum}`}
                className="absolute text-center"
                style={{
                  left: `${roundIndex * roundSpacing}px`,
                  top: '0px',
                  width: `${cardWidth}px`,
                }}
              >
                <h3 className="text-sm font-bold text-white bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg py-2 px-3 border border-white/10">
                  {roundNames[roundNum] || `Round ${roundNum + 1}`}
                </h3>
                <div className="text-xs text-white/50 mt-1">
                  {matches.filter((m) => m.winner).length} / {matches.length}{' '}
                  complete
                </div>
              </div>
            );
          })}

          {/* Bracket connecting lines */}
          {visibleRounds.slice(0, -1).map((roundNum, roundIndex) => {
            const matches = roundsData[roundNum] || [];
            const nextRoundNum = visibleRounds[roundIndex + 1];
            const nextRoundMatches = roundsData[nextRoundNum] || [];
            const lines = [];

            for (let i = 0; i < matches.length; i += 2) {
              const match1Y = getScaledMatchY(
                roundIndex,
                i,
                matches.length,
                baseSpacing
              );
              const match2Y =
                i + 1 < matches.length
                  ? getScaledMatchY(
                      roundIndex,
                      i + 1,
                      matches.length,
                      baseSpacing
                    )
                  : match1Y;
              const nextMatchIndex = Math.floor(i / 2);

              if (nextMatchIndex < nextRoundMatches.length) {
                const nextMatchY = getScaledMatchY(
                  roundIndex + 1,
                  nextMatchIndex,
                  nextRoundMatches.length,
                  baseSpacing
                );
                const currentRoundX = roundIndex * roundSpacing + cardWidth;
                const centerX = currentRoundX + 20;

                // Horizontal lines from matches
                lines.push(
                  <div
                    key={`h1-${roundNum}-${i}`}
                    className="absolute bg-white/40 h-0.5"
                    style={{
                      left: `${currentRoundX}px`,
                      top: `${match1Y + cardHeight * 0.5}px`,
                      width: '20px',
                    }}
                  />
                );

                if (i + 1 < matches.length) {
                  lines.push(
                    <div
                      key={`h2-${roundNum}-${i}`}
                      className="absolute bg-white/40 h-0.5"
                      style={{
                        left: `${currentRoundX}px`,
                        top: `${match2Y + cardHeight * 0.5}px`,
                        width: '20px',
                      }}
                    />
                  );
                }

                // Vertical connecting line
                if (i + 1 < matches.length && Math.abs(match2Y - match1Y) > 5) {
                  lines.push(
                    <div
                      key={`v-${roundNum}-${i}`}
                      className="absolute bg-white/40 w-0.5"
                      style={{
                        left: `${centerX}px`,
                        top: `${Math.min(match1Y, match2Y) + cardHeight * 0.5}px`,
                        height: `${Math.abs(match2Y - match1Y)}px`,
                      }}
                    />
                  );
                }

                // Line to next round
                lines.push(
                  <div
                    key={`next-${roundNum}-${i}`}
                    className="absolute bg-white/40 h-0.5"
                    style={{
                      left: `${centerX}px`,
                      top: `${nextMatchY + cardHeight * 0.5}px`,
                      width: '20px',
                    }}
                  />
                );
              }
            }

            return lines;
          })}

          {/* Match cards */}
          {visibleRounds.map((roundNum, roundIndex) => {
            const matches = roundsData[roundNum] || [];

            return matches.map((match, matchIndex) => {
              const matchY = getScaledMatchY(
                roundIndex,
                matchIndex,
                matches.length,
                baseSpacing
              );

              return (
                <div
                  key={match.id}
                  className="absolute bg-neutral-800 rounded-lg border border-white/10 shadow-lg hover:shadow-xl transition-shadow"
                  style={{
                    top: `${matchY}px`,
                    left: `${roundIndex * roundSpacing}px`,
                    width: `${cardWidth}px`,
                    height: `${cardHeight}px`,
                  }}
                >
                  <div className="p-2 space-y-1 h-full flex flex-col justify-center">
                    {/* QB 1 */}
                    <button
                      onClick={() => handleWinnerSelection(match.id, match.qb1)}
                      disabled={match.qb1.id === 'bye'}
                      className={`w-full p-2 rounded border-2 transition-all text-sm relative ${
                        match.winner?.id === match.qb1.id
                          ? 'border-green-500 bg-green-500/20 text-green-300 hover:border-red-400 hover:bg-red-400/10'
                          : match.qb1.id === 'bye'
                            ? 'border-gray-500 bg-gray-500/20 cursor-not-allowed'
                            : 'border-white/20 hover:border-blue-400 hover:bg-blue-400/10 cursor-pointer'
                      }`}
                    >
                      <div className="font-semibold truncate">
                        {match.qb1.name}
                      </div>
                      <div className="text-xs text-white/60 truncate">
                        {match.qb1.team}
                      </div>
                      {match.winner?.id === match.qb1.id && (
                        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-green-400 text-sm">
                          ✓
                        </div>
                      )}
                    </button>

                    <div className="text-center text-white/40 text-xs font-bold py-0.5">
                      VS
                    </div>

                    {/* QB 2 */}
                    <button
                      onClick={() => handleWinnerSelection(match.id, match.qb2)}
                      disabled={match.qb2.id === 'bye'}
                      className={`w-full p-2 rounded border-2 transition-all text-sm relative ${
                        match.winner?.id === match.qb2.id
                          ? 'border-green-500 bg-green-500/20 text-green-300 hover:border-red-400 hover:bg-red-400/10'
                          : match.qb2.id === 'bye'
                            ? 'border-gray-500 bg-gray-500/20 cursor-not-allowed'
                            : 'border-white/20 hover:border-blue-400 hover:bg-blue-400/10 cursor-pointer'
                      }`}
                    >
                      <div className="font-semibold truncate">
                        {match.qb2.name}
                      </div>
                      <div className="text-xs text-white/60 truncate">
                        {match.qb2.team}
                      </div>
                      {match.winner?.id === match.qb2.id && (
                        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-green-400 text-sm">
                          ✓
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              );
            });
          })}
        </div>
      </div>
    );
  };

  // Helper for scaled match positioning
  const getScaledMatchY = (roundIndex, matchIndex, totalMatches, spacing) => {
    const containerPadding = 60;

    if (roundIndex === 0) {
      // First round: simple linear spacing
      return containerPadding + matchIndex * spacing;
    }

    // Later rounds: center between parent matches
    const parentSpacing = spacing * Math.pow(2, roundIndex);
    const roundOffset = (Math.pow(2, roundIndex) - 1) * (spacing / 2);

    return containerPadding + roundOffset + matchIndex * parentSpacing;
  };

  // New region-based bracket that looks like traditional bracket
  const renderRegionBracket = () => {
    const activeRound = getCurrentActiveRound();
    const regionMatches = getRegionMatches(activeRound, currentRegion);

    // Calculate next round matches for this region
    const nextRoundMatches = getNextRoundMatchesForRegion(
      activeRound,
      currentRegion
    );

    const containerWidth = 720; // Two rounds: current + next
    const containerHeight = Math.max(600, 4 * 200 + 200); // 4 matches max per region

    return (
      <div className="space-y-6">
        {/* Region Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">
            Region {currentRegion + 1}
          </h3>
          <div className="text-white/60 text-sm mb-2">
            {roundNames[activeRound] || `Round ${activeRound + 1}`}
          </div>
          <div className="text-white/50 text-sm">
            {regionMatches.filter((m) => m.winner).length} /{' '}
            {regionMatches.length} matches complete
          </div>
        </div>

        {/* Region Navigation */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: REGIONS }, (_, i) => {
            const regionRoundMatches = getRegionMatches(activeRound, i);
            const isComplete = isRegionComplete(activeRound, i);
            const hasMatches = regionRoundMatches.length > 0;

            return (
              <button
                key={i}
                onClick={() => setCurrentRegion(i)}
                disabled={!hasMatches}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentRegion === i
                    ? 'bg-blue-600 text-white'
                    : isComplete
                      ? 'bg-green-600/50 text-green-300 hover:bg-green-600/70'
                      : hasMatches
                        ? 'bg-neutral-700 text-white/70 hover:bg-neutral-600'
                        : 'bg-neutral-800/50 text-white/30 cursor-not-allowed'
                }`}
              >
                Region {i + 1}
                {isComplete && ' ✓'}
              </button>
            );
          })}
        </div>

        {/* Region Bracket Display */}
        <div className="w-full overflow-hidden">
          <div
            className="relative mx-auto"
            style={{
              width: `${containerWidth}px`,
              height: `${containerHeight}px`,
              minHeight: '600px',
              padding: '40px 20px',
            }}
          >
            {/* Round headers */}
            <div
              className="absolute text-center"
              style={{
                left: '0px',
                top: '0px',
                width: '280px',
              }}
            >
              <h3 className="text-sm font-bold text-white bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg py-2 px-3 border border-white/10">
                {roundNames[activeRound] || `Round ${activeRound + 1}`}
              </h3>
              <div className="text-xs text-white/50 mt-1">
                {regionMatches.filter((m) => m.winner).length} /{' '}
                {regionMatches.length} complete
              </div>
            </div>

            <div
              className="absolute text-center"
              style={{
                left: '320px',
                top: '0px',
                width: '280px',
              }}
            >
              <h3 className="text-sm font-bold text-white bg-gradient-to-r from-purple-600/30 to-green-600/30 rounded-lg py-2 px-3 border border-white/10">
                {roundNames[activeRound + 1] || `Round ${activeRound + 2}`}
              </h3>
              <div className="text-xs text-white/50 mt-1">
                {nextRoundMatches.filter((m) => m.winner).length} /{' '}
                {nextRoundMatches.length} pending
              </div>
            </div>

            {/* Connecting lines for region matches */}
            {regionMatches.map((match, index) => {
              if (index % 2 === 0) {
                // Only draw lines for pairs
                const match1Y = getRegionMatchY(index);
                const match2Y =
                  index + 1 < regionMatches.length
                    ? getRegionMatchY(index + 1)
                    : match1Y;
                const nextMatchIndex = Math.floor(index / 2);
                const nextMatchY = getRegionMatchY(nextMatchIndex, true);

                const currentRoundX = 280;
                const centerX = currentRoundX + 20;

                const lines = [];

                // Horizontal lines from current matches
                lines.push(
                  <div
                    key={`h1-${index}`}
                    className="absolute bg-white/40 h-0.5"
                    style={{
                      left: `${currentRoundX}px`,
                      top: `${match1Y + 70}px`,
                      width: '20px',
                    }}
                  />
                );

                if (index + 1 < regionMatches.length) {
                  lines.push(
                    <div
                      key={`h2-${index}`}
                      className="absolute bg-white/40 h-0.5"
                      style={{
                        left: `${currentRoundX}px`,
                        top: `${match2Y + 70}px`,
                        width: '20px',
                      }}
                    />
                  );
                }

                // Vertical connecting line
                if (
                  index + 1 < regionMatches.length &&
                  Math.abs(match2Y - match1Y) > 5
                ) {
                  lines.push(
                    <div
                      key={`v-${index}`}
                      className="absolute bg-white/40 w-0.5"
                      style={{
                        left: `${centerX}px`,
                        top: `${Math.min(match1Y, match2Y) + 70}px`,
                        height: `${Math.abs(match2Y - match1Y)}px`,
                      }}
                    />
                  );
                }

                // Line to next round
                lines.push(
                  <div
                    key={`next-${index}`}
                    className="absolute bg-white/40 h-0.5"
                    style={{
                      left: `${centerX}px`,
                      top: `${nextMatchY + 70}px`,
                      width: '20px',
                    }}
                  />
                );

                return lines;
              }
              return null;
            })}

            {/* Current round matches */}
            {regionMatches.map((match, index) => {
              const matchY = getRegionMatchY(index);

              return (
                <div
                  key={match.id}
                  className="absolute w-72 bg-neutral-800 rounded-lg border border-white/10 shadow-lg hover:shadow-xl transition-shadow"
                  style={{
                    top: `${matchY}px`,
                    left: '0px',
                  }}
                >
                  <div className="p-3 space-y-2">
                    {/* QB 1 */}
                    <button
                      onClick={() => handleWinnerSelection(match.id, match.qb1)}
                      disabled={match.qb1.id === 'bye'}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-sm relative ${
                        match.winner?.id === match.qb1.id
                          ? 'border-green-500 bg-green-500/20 text-green-300 hover:border-red-400 hover:bg-red-400/10'
                          : match.qb1.id === 'bye'
                            ? 'border-gray-500 bg-gray-500/20 cursor-not-allowed'
                            : 'border-white/20 hover:border-blue-400 hover:bg-blue-400/10 cursor-pointer'
                      }`}
                      title={
                        match.winner?.id === match.qb1.id
                          ? 'Click to deselect'
                          : ''
                      }
                    >
                      <div className="font-semibold truncate">
                        {match.qb1.name}
                      </div>
                      <div className="text-xs text-white/60">
                        {match.qb1.team}
                      </div>
                      {match.winner?.id === match.qb1.id && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-lg">
                          ✓
                        </div>
                      )}
                    </button>

                    <div className="text-center text-white/40 text-xs font-bold py-1">
                      VS
                    </div>

                    {/* QB 2 */}
                    <button
                      onClick={() => handleWinnerSelection(match.id, match.qb2)}
                      disabled={match.qb2.id === 'bye'}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-sm relative ${
                        match.winner?.id === match.qb2.id
                          ? 'border-green-500 bg-green-500/20 text-green-300 hover:border-red-400 hover:bg-red-400/10'
                          : match.qb2.id === 'bye'
                            ? 'border-gray-500 bg-gray-500/20 cursor-not-allowed'
                            : 'border-white/20 hover:border-blue-400 hover:bg-blue-400/10 cursor-pointer'
                      }`}
                      title={
                        match.winner?.id === match.qb2.id
                          ? 'Click to deselect'
                          : ''
                      }
                    >
                      <div className="font-semibold truncate">
                        {match.qb2.name}
                      </div>
                      <div className="text-xs text-white/60">
                        {match.qb2.team}
                      </div>
                      {match.winner?.id === match.qb2.id && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-lg">
                          ✓
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Next round matches (awaiting winners) */}
            {nextRoundMatches.map((match, index) => {
              const matchY = getRegionMatchY(index, true);

              return (
                <div
                  key={match?.id || `next-${index}`}
                  className="absolute w-72 bg-neutral-800/50 rounded-lg border border-white/10 shadow-lg"
                  style={{
                    top: `${matchY}px`,
                    left: '320px',
                  }}
                >
                  <div className="p-3 space-y-2">
                    {/* Next Round QB 1 */}
                    <div
                      className={`w-full p-3 rounded-lg border-2 text-sm ${
                        match?.qb1?.name
                          ? 'border-green-500/50 bg-green-500/10 text-green-300'
                          : 'border-white/10 bg-neutral-700/20'
                      }`}
                    >
                      <div className="font-semibold truncate">
                        {match?.qb1?.name || 'Awaiting Winner'}
                      </div>
                      <div className="text-xs text-white/40">
                        {match?.qb1?.team || 'TBD'}
                      </div>
                    </div>

                    <div className="text-center text-white/30 text-xs font-bold py-1">
                      VS
                    </div>

                    {/* Next Round QB 2 */}
                    <div
                      className={`w-full p-3 rounded-lg border-2 text-sm ${
                        match?.qb2?.name
                          ? 'border-green-500/50 bg-green-500/10 text-green-300'
                          : 'border-white/10 bg-neutral-700/20'
                      }`}
                    >
                      <div className="font-semibold truncate">
                        {match?.qb2?.name || 'Awaiting Winner'}
                      </div>
                      <div className="text-xs text-white/40">
                        {match?.qb2?.team || 'TBD'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Auto-advance indicator */}
        {renderAutoAdvanceIndicator()}
      </div>
    );
  };

  // Helper function for match Y positioning
  const getMatchY = (roundIndex, matchIndex, totalMatches) => {
    const baseSpacing = 200; // Base spacing between matches
    const containerPadding = 60; // Top padding

    if (roundIndex === 0) {
      // First round: simple linear spacing
      return containerPadding + matchIndex * baseSpacing;
    }

    // Later rounds: center between parent matches
    const parentSpacing = baseSpacing * Math.pow(2, roundIndex);
    const roundOffset = (Math.pow(2, roundIndex) - 1) * (baseSpacing / 2);

    return containerPadding + roundOffset + matchIndex * parentSpacing;
  };

  // Helper function for region match Y positioning
  const getRegionMatchY = (matchIndex, isNextRound = false) => {
    const baseSpacing = 200;
    const containerPadding = 60;

    if (isNextRound) {
      // Next round matches are spaced further apart and offset to center between pairs
      return containerPadding + 100 + matchIndex * 400; // 100px offset + 400px spacing
    }

    return containerPadding + matchIndex * baseSpacing;
  };

  // Get next round matches for current region
  const getNextRoundMatchesForRegion = (currentRound, region) => {
    const nextRound = currentRound + 1;
    const nextRoundData = roundsData[nextRound] || [];

    // Calculate how many next round matches this region should show
    const regionMatches = getRegionMatches(currentRound, region);
    const expectedNextMatches = Math.ceil(regionMatches.length / 2);

    // Get the slice of next round matches that correspond to this region
    const startIndex = region * expectedNextMatches;

    const result = [];
    for (let i = 0; i < expectedNextMatches; i++) {
      const actualMatch = nextRoundData[startIndex + i];

      if (actualMatch) {
        result.push(actualMatch);
      } else {
        // Create placeholder match and populate with winners from current round
        const match1Index = i * 2;
        const match2Index = i * 2 + 1;

        const match1 = regionMatches[match1Index];
        const match2 = regionMatches[match2Index];

        const qb1 = match1?.winner || null;
        const qb2 = match2?.winner || null;

        result.push({
          id: `placeholder-${nextRound}-${startIndex + i}`,
          qb1: qb1,
          qb2: qb2,
          winner: null,
          round: nextRound,
        });
      }
    }

    return result;
  };

  // Region-based logic for better navigation (simplified)
  const REGIONS = 4;
  const MATCHES_PER_REGION = 4;

  const getRegionMatches = (round, region) => {
    const roundMatches = roundsData[round] || [];

    if (round === 0) {
      const startIndex = region * MATCHES_PER_REGION;
      const endIndex = startIndex + MATCHES_PER_REGION;
      return roundMatches.slice(startIndex, endIndex);
    }

    const matchesInRound = Math.max(1, 16 / Math.pow(2, round));
    if (matchesInRound <= 4) {
      return roundMatches;
    }

    const matchesPerRegion = Math.max(1, matchesInRound / REGIONS);
    const startIndex = Math.floor(region * matchesPerRegion);
    const endIndex = Math.min(
      roundMatches.length,
      Math.ceil((region + 1) * matchesPerRegion)
    );
    return roundMatches.slice(startIndex, endIndex);
  };

  const getCurrentActiveRound = () => {
    return (
      Object.keys(roundsData)
        .map(Number)
        .find((round) => {
          const matches = roundsData[round] || [];
          return matches.some((m) => !m.winner);
        }) || 0
    );
  };

  const isRegionComplete = (round, region) => {
    const regionMatches = getRegionMatches(round, region);
    return regionMatches.length > 0 && regionMatches.every((m) => m.winner);
  };

  // Simplified region view
  const renderRegionView = () => {
    const activeRound = getCurrentActiveRound();
    const totalMatches = roundsData[activeRound]?.length || 0;

    if (totalMatches <= 4) {
      return renderSimpleBracket();
    }

    const regionMatches = getRegionMatches(activeRound, currentRegion);

    return (
      <div className="space-y-6">
        {/* Region Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">
            Region {currentRegion + 1}
          </h3>
          <div className="text-white/60 text-sm mb-2">
            {roundNames[activeRound] || `Round ${activeRound + 1}`}
          </div>
        </div>

        {/* Region Navigation */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: REGIONS }, (_, i) => {
            const regionRoundMatches = getRegionMatches(activeRound, i);
            const isComplete = isRegionComplete(activeRound, i);
            const hasMatches = regionRoundMatches.length > 0;

            return (
              <button
                key={i}
                onClick={() => setCurrentRegion(i)}
                disabled={!hasMatches}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentRegion === i
                    ? 'bg-blue-600 text-white'
                    : isComplete
                      ? 'bg-green-600/50 text-green-300 hover:bg-green-600/70'
                      : hasMatches
                        ? 'bg-neutral-700 text-white/70 hover:bg-neutral-600'
                        : 'bg-neutral-800/50 text-white/30 cursor-not-allowed'
                }`}
              >
                Region {i + 1}
                {isComplete && ' ✓'}
              </button>
            );
          })}
        </div>

        {/* Region Matches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {regionMatches.map((match) => (
            <div
              key={match.id}
              className="bg-neutral-800 rounded-lg border border-white/10 p-4 shadow-lg"
            >
              <div className="space-y-3">
                {/* QB 1 */}
                <button
                  onClick={() => handleWinnerSelection(match.id, match.qb1)}
                  disabled={match.qb1.id === 'bye'}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-sm relative ${
                    match.winner?.id === match.qb1.id
                      ? 'border-green-500 bg-green-500/20 text-green-300 hover:border-red-400 hover:bg-red-400/10'
                      : match.qb1.id === 'bye'
                        ? 'border-gray-500 bg-gray-500/20 cursor-not-allowed'
                        : 'border-white/20 hover:border-blue-400 hover:bg-blue-400/10 cursor-pointer'
                  }`}
                  title={
                    match.winner?.id === match.qb1.id ? 'Click to deselect' : ''
                  }
                >
                  <div className="font-semibold">{match.qb1.name}</div>
                  <div className="text-xs text-white/60">{match.qb1.team}</div>
                  {match.winner?.id === match.qb1.id && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-lg">
                      ✓
                    </div>
                  )}
                </button>

                <div className="text-center text-white/40 text-xs font-bold py-1">
                  VS
                </div>

                {/* QB 2 */}
                <button
                  onClick={() => handleWinnerSelection(match.id, match.qb2)}
                  disabled={match.qb2.id === 'bye'}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-sm relative ${
                    match.winner?.id === match.qb2.id
                      ? 'border-green-500 bg-green-500/20 text-green-300 hover:border-red-400 hover:bg-red-400/10'
                      : match.qb2.id === 'bye'
                        ? 'border-gray-500 bg-gray-500/20 cursor-not-allowed'
                        : 'border-white/20 hover:border-blue-400 hover:bg-blue-400/10 cursor-pointer'
                  }`}
                  title={
                    match.winner?.id === match.qb2.id ? 'Click to deselect' : ''
                  }
                >
                  <div className="font-semibold">{match.qb2.name}</div>
                  <div className="text-xs text-white/60">{match.qb2.team}</div>
                  {match.winner?.id === match.qb2.id && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-lg">
                      ✓
                    </div>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Compact view
  const renderCompactView = () => {
    const activeRound = getCurrentActiveRound();
    const matches = roundsData[activeRound] || [];

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">
            {roundNames[activeRound] || `Round ${activeRound + 1}`}
          </h3>
          <div className="text-white/60 text-sm">
            {matches.filter((m) => m.winner).length} / {matches.length} matches
            complete
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-neutral-800 rounded-lg border border-white/10 p-4 shadow-lg"
            >
              <div className="space-y-3">
                {/* QB 1 */}
                <button
                  onClick={() => handleWinnerSelection(match.id, match.qb1)}
                  disabled={match.qb1.id === 'bye'}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-sm relative ${
                    match.winner?.id === match.qb1.id
                      ? 'border-green-500 bg-green-500/20 text-green-300 hover:border-red-400 hover:bg-red-400/10'
                      : match.qb1.id === 'bye'
                        ? 'border-gray-500 bg-gray-500/20 cursor-not-allowed'
                        : 'border-white/20 hover:border-blue-400 hover:bg-blue-400/10 cursor-pointer'
                  }`}
                  title={
                    match.winner?.id === match.qb1.id ? 'Click to deselect' : ''
                  }
                >
                  <div className="font-semibold">{match.qb1.name}</div>
                  <div className="text-xs text-white/60">{match.qb1.team}</div>
                  {match.winner?.id === match.qb1.id && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-lg">
                      ✓
                    </div>
                  )}
                </button>

                <div className="text-center text-white/40 text-xs font-bold py-1">
                  VS
                </div>

                {/* QB 2 */}
                <button
                  onClick={() => handleWinnerSelection(match.id, match.qb2)}
                  disabled={match.qb2.id === 'bye'}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-sm relative ${
                    match.winner?.id === match.qb2.id
                      ? 'border-green-500 bg-green-500/20 text-green-300 hover:border-red-400 hover:bg-red-400/10'
                      : match.qb2.id === 'bye'
                        ? 'border-gray-500 bg-gray-500/20 cursor-not-allowed'
                        : 'border-white/20 hover:border-blue-400 hover:bg-blue-400/10 cursor-pointer'
                  }`}
                  title={
                    match.winner?.id === match.qb2.id ? 'Click to deselect' : ''
                  }
                >
                  <div className="font-semibold">{match.qb2.name}</div>
                  <div className="text-xs text-white/60">{match.qb2.team}</div>
                  {match.winner?.id === match.qb2.id && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-lg">
                      ✓
                    </div>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Enhanced bracket layout with collapsible rounds
  const renderAdaptiveBracket = () => {
    const activeRound = getCurrentActiveRound();
    const rounds = Object.keys(roundsData)
      .sort((a, b) => Number(a) - Number(b))
      .map(Number);

    // Calculate dynamic sizing based on screen
    const maxScreenWidth =
      typeof window !== 'undefined' ? window.innerWidth - 100 : 1200;
    const visibleRounds = Math.min(4, Math.floor(maxScreenWidth / 320));

    // Determine which rounds to show in detail
    const startRound = Math.max(0, activeRound - 1);
    const endRound = Math.min(
      rounds.length - 1,
      startRound + visibleRounds - 1
    );

    const detailedRounds = rounds.slice(startRound, endRound + 1);
    const containerWidth = detailedRounds.length * 320 + 100;

    // Calculate dynamic height based on largest round
    const maxMatches = Math.max(
      ...detailedRounds.map((r) => roundsData[r]?.length || 0)
    );
    const containerHeight = Math.max(400, maxMatches * 140 + 200); // Smaller cards

    return (
      <div className="w-full h-full flex flex-col">
        {/* Round Overview Bar */}
        <div className="flex justify-center mb-4 bg-neutral-900/50 rounded-lg p-2 mx-4">
          {rounds.map((roundNum) => {
            const matches = roundsData[roundNum] || [];
            const completed = matches.filter((m) => m.winner).length;
            const isActive = roundNum === activeRound;
            const isDetailed = detailedRounds.includes(roundNum);

            return (
              <div
                key={roundNum}
                className={`px-3 py-2 mx-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : completed === matches.length && matches.length > 0
                      ? 'bg-green-600/70 text-green-200'
                      : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                } ${isDetailed ? 'ring-2 ring-white/30' : ''}`}
                onClick={() => scrollToRound(roundNum)}
              >
                <div className="font-bold">
                  {roundNames[roundNum] || `R${roundNum + 1}`}
                </div>
                <div className="text-[10px] opacity-80">
                  {completed}/{matches.length}
                </div>
              </div>
            );
          })}
        </div>

        {/* Compact Bracket Display */}
        <div className="flex-1 overflow-hidden">
          <div
            className="relative mx-auto"
            style={{
              width: `${containerWidth}px`,
              height: `${containerHeight}px`,
              minHeight: '400px',
              padding: '20px',
            }}
          >
            {/* Round headers for detailed rounds */}
            {detailedRounds.map((roundNum, index) => {
              const matches = roundsData[roundNum] || [];
              return (
                <div
                  key={`header-${roundNum}`}
                  className="absolute text-center"
                  style={{
                    left: `${index * 320}px`,
                    top: '0px',
                    width: '280px',
                  }}
                >
                  <h3 className="text-sm font-bold text-white bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg py-2 px-3 border border-white/10">
                    {roundNames[roundNum] || `Round ${roundNum + 1}`}
                  </h3>
                  <div className="text-xs text-white/50 mt-1">
                    {matches.filter((m) => m.winner).length} / {matches.length}{' '}
                    complete
                  </div>
                </div>
              );
            })}

            {/* Connecting lines for detailed rounds */}
            {detailedRounds.slice(0, -1).map((roundNum, roundIndex) => {
              const matches = roundsData[roundNum] || [];
              const nextRoundNum = detailedRounds[roundIndex + 1];
              const nextRoundMatches = roundsData[nextRoundNum] || [];
              const lines = [];

              for (let i = 0; i < matches.length; i += 2) {
                const match1Y = getCompactMatchY(roundIndex, i, matches.length);
                const match2Y =
                  i + 1 < matches.length
                    ? getCompactMatchY(roundIndex, i + 1, matches.length)
                    : match1Y;
                const nextMatchIndex = Math.floor(i / 2);

                if (nextMatchIndex < nextRoundMatches.length) {
                  const nextMatchY = getCompactMatchY(
                    roundIndex + 1,
                    nextMatchIndex,
                    nextRoundMatches.length
                  );
                  const currentRoundX = roundIndex * 320 + 260; // Adjusted for smaller cards
                  const centerX = currentRoundX + 20;

                  // Connection lines
                  lines.push(
                    <div
                      key={`h1-${roundNum}-${i}`}
                      className="absolute bg-white/30 h-0.5"
                      style={{
                        left: `${currentRoundX}px`,
                        top: `${match1Y + 50}px`,
                        width: '20px',
                      }}
                    />
                  );

                  if (i + 1 < matches.length) {
                    lines.push(
                      <div
                        key={`h2-${roundNum}-${i}`}
                        className="absolute bg-white/30 h-0.5"
                        style={{
                          left: `${currentRoundX}px`,
                          top: `${match2Y + 50}px`,
                          width: '20px',
                        }}
                      />
                    );
                  }

                  if (
                    i + 1 < matches.length &&
                    Math.abs(match2Y - match1Y) > 5
                  ) {
                    lines.push(
                      <div
                        key={`v-${roundNum}-${i}`}
                        className="absolute bg-white/30 w-0.5"
                        style={{
                          left: `${centerX}px`,
                          top: `${Math.min(match1Y, match2Y) + 50}px`,
                          height: `${Math.abs(match2Y - match1Y)}px`,
                        }}
                      />
                    );
                  }

                  lines.push(
                    <div
                      key={`next-${roundNum}-${i}`}
                      className="absolute bg-white/30 h-0.5"
                      style={{
                        left: `${centerX}px`,
                        top: `${nextMatchY + 50}px`,
                        width: '20px',
                      }}
                    />
                  );
                }
              }

              return lines;
            })}

            {/* Compact match cards */}
            {detailedRounds.map((roundNum, roundIndex) => {
              const matches = roundsData[roundNum] || [];

              return matches.map((match, matchIndex) => {
                const matchY = getCompactMatchY(
                  roundIndex,
                  matchIndex,
                  matches.length
                );

                return (
                  <div
                    key={match.id}
                    className="absolute w-60 bg-neutral-800 rounded-lg border border-white/10 shadow-lg hover:shadow-xl transition-shadow"
                    style={{
                      top: `${matchY}px`,
                      left: `${roundIndex * 320}px`,
                    }}
                  >
                    <div className="p-2 space-y-1">
                      {/* Compact QB 1 */}
                      <button
                        onClick={() =>
                          handleWinnerSelection(match.id, match.qb1)
                        }
                        disabled={match.qb1.id === 'bye'}
                        className={`w-full p-2 rounded border-2 transition-all text-xs relative ${
                          match.winner?.id === match.qb1.id
                            ? 'border-green-500 bg-green-500/20 text-green-300'
                            : match.qb1.id === 'bye'
                              ? 'border-gray-500 bg-gray-500/20 cursor-not-allowed'
                              : 'border-white/20 hover:border-blue-400 hover:bg-blue-400/10 cursor-pointer'
                        }`}
                      >
                        <div className="font-semibold truncate text-sm">
                          {match.qb1.name}
                        </div>
                        <div className="text-[10px] text-white/60 truncate">
                          {match.qb1.team}
                        </div>
                        {match.winner?.id === match.qb1.id && (
                          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-green-400 text-sm">
                            ✓
                          </div>
                        )}
                      </button>

                      <div className="text-center text-white/40 text-[10px] font-bold">
                        VS
                      </div>

                      {/* Compact QB 2 */}
                      <button
                        onClick={() =>
                          handleWinnerSelection(match.id, match.qb2)
                        }
                        disabled={match.qb2.id === 'bye'}
                        className={`w-full p-2 rounded border-2 transition-all text-xs relative ${
                          match.winner?.id === match.qb2.id
                            ? 'border-green-500 bg-green-500/20 text-green-300'
                            : match.qb2.id === 'bye'
                              ? 'border-gray-500 bg-gray-500/20 cursor-not-allowed'
                              : 'border-white/20 hover:border-blue-400 hover:bg-blue-400/10 cursor-pointer'
                        }`}
                      >
                        <div className="font-semibold truncate text-sm">
                          {match.qb2.name}
                        </div>
                        <div className="text-[10px] text-white/60 truncate">
                          {match.qb2.team}
                        </div>
                        {match.winner?.id === match.qb2.id && (
                          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-green-400 text-sm">
                            ✓
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-center gap-2 mt-4 pb-4">
          <button
            onClick={() => navigateRounds('prev')}
            disabled={startRound === 0}
            className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={() => navigateRounds('next')}
            disabled={endRound === rounds.length - 1}
            className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            Next →
          </button>
          <button
            onClick={() => setViewMode('overview')}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors ml-4"
          >
            Full Overview
          </button>
        </div>
      </div>
    );
  };

  // Helper for compact match positioning
  const getCompactMatchY = (roundIndex, matchIndex, totalMatches) => {
    const baseSpacing = 140; // Smaller spacing for compact view
    const containerPadding = 40;

    if (roundIndex === 0) {
      return containerPadding + matchIndex * baseSpacing;
    }

    const parentSpacing = baseSpacing * Math.pow(2, roundIndex);
    const roundOffset = (Math.pow(2, roundIndex) - 1) * (baseSpacing / 2);
    return containerPadding + roundOffset + matchIndex * parentSpacing;
  };

  // Navigation functions
  const navigateRounds = (direction) => {
    const maxScreenWidth =
      typeof window !== 'undefined' ? window.innerWidth - 100 : 1200;
    const visibleRounds = Math.min(4, Math.floor(maxScreenWidth / 320));
    const totalRounds = Object.keys(roundsData).length;

    if (direction === 'prev') {
      setRoundViewStart(Math.max(0, roundViewStart - 1));
    } else {
      setRoundViewStart(
        Math.min(totalRounds - visibleRounds, roundViewStart + 1)
      );
    }
  };

  const scrollToRound = (roundNum) => {
    const maxScreenWidth =
      typeof window !== 'undefined' ? window.innerWidth - 100 : 1200;
    const visibleRounds = Math.min(4, Math.floor(maxScreenWidth / 320));
    const newStart = Math.max(
      0,
      Math.min(roundNum - 1, Object.keys(roundsData).length - visibleRounds)
    );
    setRoundViewStart(newStart);
  };

  // View controls
  const renderViewControls = () => {
    if (Object.keys(roundsData).length === 0) return null;

    return (
      <div className="flex justify-center mb-6 gap-2">
        <button
          onClick={() => {
            setShowRegionView(true);
            setShowCompactView(false);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showRegionView
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-700 text-white/70 hover:bg-neutral-600'
          }`}
        >
          Region View
        </button>
        <button
          onClick={() => {
            setShowRegionView(false);
            setShowCompactView(false);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !showRegionView && !showCompactView
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-700 text-white/70 hover:bg-neutral-600'
          }`}
        >
          Bracket View
        </button>
        <button
          onClick={() => {
            setShowRegionView(false);
            setShowCompactView(true);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showCompactView
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-700 text-white/70 hover:bg-neutral-600'
          }`}
        >
          Compact View
        </button>
      </div>
    );
  };

  // Auto-advance region when current region completes
  useEffect(() => {
    // Auto-advance should work for both bracket view and region view when using regions
    const activeRound = getCurrentActiveRound();
    const totalMatches = roundsData[activeRound]?.length || 0;

    // Only use auto-advance when we're in region-based display (large tournaments)
    if (totalMatches > 4) {
      const isComplete = isRegionComplete(activeRound, currentRegion);

      if (isComplete && !isAdvancing) {
        // Clear any existing timer
        if (autoAdvanceTimer) {
          clearTimeout(autoAdvanceTimer);
        }

        // Find the next region that has matches and isn't complete
        const nextAvailableRegion = findNextAvailableRegion(
          activeRound,
          currentRegion
        );

        if (nextAvailableRegion !== null) {
          setIsAdvancing(true);

          const timer = setTimeout(() => {
            setCurrentRegion(nextAvailableRegion);
            setIsAdvancing(false);
          }, 2000); // 2 second delay for better UX

          setAutoAdvanceTimer(timer);
        }
      }
    }

    // Cleanup function
    return () => {
      if (autoAdvanceTimer) {
        clearTimeout(autoAdvanceTimer);
        setAutoAdvanceTimer(null);
      }
    };
  }, [bracket, currentRegion, showRegionView, isAdvancing]);

  // Helper function to find the next available region
  const findNextAvailableRegion = (round, currentRegion) => {
    // First, check if there are incomplete regions in the current round
    for (let i = 0; i < REGIONS; i++) {
      const nextRegion = (currentRegion + 1 + i) % REGIONS;
      const regionMatches = getRegionMatches(round, nextRegion);

      if (regionMatches.length > 0 && !isRegionComplete(round, nextRegion)) {
        return nextRegion;
      }
    }

    // If all regions in current round are complete, check next round
    const nextRound = round + 1;
    if (roundsData[nextRound] && roundsData[nextRound].length > 0) {
      // Reset to region 0 for the new round
      const firstRegionMatches = getRegionMatches(nextRound, 0);
      if (firstRegionMatches.length > 0) {
        return 0;
      }
    }

    return null; // No more regions to advance to
  };

  // Enhanced auto-advance indicator with countdown
  const renderAutoAdvanceIndicator = () => {
    const activeRound = getCurrentActiveRound();
    const isComplete = isRegionComplete(activeRound, currentRegion);
    const nextRegion = findNextAvailableRegion(activeRound, currentRegion);

    if (isComplete && nextRegion !== null && (isAdvancing || showRegionView)) {
      return (
        <div className="text-center mt-6 p-4 bg-green-600/20 border border-green-500/30 rounded-lg animate-pulse">
          <div className="text-green-400 font-medium">
            ✓ Region {currentRegion + 1} Complete!
          </div>
          <div className="text-green-300/80 text-sm mt-1">
            {isAdvancing ? (
              <>Advancing to Region {nextRegion + 1}...</>
            ) : (
              `Will advance to Region ${nextRegion + 1} in 2 seconds`
            )}
          </div>
          {!isAdvancing && (
            <button
              onClick={() => {
                if (autoAdvanceTimer) {
                  clearTimeout(autoAdvanceTimer);
                  setAutoAdvanceTimer(null);
                }
                setCurrentRegion(nextRegion);
              }}
              className="mt-2 px-3 py-1 bg-green-600/50 hover:bg-green-600/70 text-green-200 text-xs rounded-lg transition-colors"
            >
              Advance Now
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  if (Object.keys(roundsData).length === 0) {
    return (
      <div className="text-center text-white/60 py-8">
        No tournament data available
      </div>
    );
  }

  return (
    <div className="tournament-container">
      {renderViewControls()}

      {showRegionView
        ? renderRegionView()
        : showCompactView
          ? renderCompactView()
          : renderScaledBracket()}
    </div>
  );
};

export default TournamentBracket;
