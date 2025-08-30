import React from 'react';

const TournamentBracket = ({ bracket = [], selectWinner, roundNames = [] }) => {
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
  const rounds = Object.keys(roundsData)
    .sort((a, b) => Number(a) - Number(b))
    .map(Number);

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

  // Calculate responsive sizing
  const getResponsiveSizing = () => {
    const maxScreenWidth = typeof window !== 'undefined' ? window.innerWidth - 100 : 1200;
    const maxScreenHeight = typeof window !== 'undefined' ? window.innerHeight - 300 : 700;
    
    const roundCount = rounds.length;
    const firstRoundMatches = roundsData[0]?.length || 0;
    
    // Calculate card width based on available space
    const minCardWidth = 200;
    const maxCardWidth = 280;
    const roundSpacing = 60; // Space between rounds
    
    const availableWidth = maxScreenWidth - (roundCount - 1) * roundSpacing - 40; // 40px padding
    const cardWidth = Math.min(maxCardWidth, Math.max(minCardWidth, availableWidth / roundCount));
    
    // Calculate card height based on available space
    const minCardHeight = 120;
    const maxCardHeight = 180;
    const matchSpacing = 40; // Space between matches
    
    const availableHeight = maxScreenHeight - 100; // 100px for headers
    const cardHeight = Math.min(maxCardHeight, Math.max(minCardHeight, availableHeight / Math.max(firstRoundMatches, 8) - matchSpacing));
    
    return {
      cardWidth,
      cardHeight,
      roundSpacing: cardWidth + roundSpacing,
      matchSpacing: cardHeight + matchSpacing
    };
  };

  const { cardWidth, cardHeight, roundSpacing, matchSpacing } = getResponsiveSizing();

  // Calculate match Y position for proper bracket alignment
  const getMatchY = (roundIndex, matchIndex, roundMatches) => {
    const baseY = 80; // Top padding for round headers
    
    if (roundIndex === 0) {
      // First round: simple linear spacing
      return baseY + matchIndex * matchSpacing;
    }
    
    // Later rounds: position matches between their parent matches
    const parentRoundMatches = roundsData[roundIndex - 1] || [];
    const parentsPerMatch = parentRoundMatches.length / roundMatches.length;
    
    // Find the center point between the parent matches
    const startParentIndex = matchIndex * parentsPerMatch;
    const endParentIndex = startParentIndex + parentsPerMatch - 1;
    
    const startParentY = getMatchY(roundIndex - 1, startParentIndex, parentRoundMatches);
    const endParentY = getMatchY(roundIndex - 1, endParentIndex, parentRoundMatches);
    
    return (startParentY + endParentY) / 2;
  };

  // Calculate container dimensions
  const containerWidth = rounds.length * roundSpacing + 40;
  const firstRoundMatches = roundsData[0]?.length || 0;
  const containerHeight = Math.max(500, firstRoundMatches * matchSpacing + 200);

  if (rounds.length === 0) {
    return (
      <div className="text-center text-white/60 py-8">
        No tournament data available
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto bg-neutral-900 rounded-lg p-4">
      <div
        className="relative mx-auto"
        style={{
          width: `${containerWidth}px`,
          height: `${containerHeight}px`,
          minWidth: '800px',
          minHeight: '600px'
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
                left: `${roundIndex * roundSpacing + 20}px`,
                top: '20px',
                width: `${cardWidth}px`,
              }}
            >
              <h3 className="text-sm font-bold text-white bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg py-2 px-3 border border-white/10">
                {roundNames[roundNum] || `Round ${roundNum + 1}`}
              </h3>
              <div className="text-xs text-white/50 mt-1">
                {matches.filter((m) => m.winner).length} / {matches.length} complete
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
            const match1Y = getMatchY(roundIndex, i, matches);
            const match2Y = i + 1 < matches.length 
              ? getMatchY(roundIndex, i + 1, matches)
              : match1Y;
            const nextMatchIndex = Math.floor(i / 2);

            if (nextMatchIndex < nextRoundMatches.length) {
              const nextMatchY = getMatchY(roundIndex + 1, nextMatchIndex, nextRoundMatches);
              const currentRoundX = roundIndex * roundSpacing + cardWidth + 20;
              const centerX = currentRoundX + 20;

              // Horizontal lines from matches to center point
              lines.push(
                <div
                  key={`h1-${roundNum}-${i}`}
                  className="absolute bg-white/40 h-0.5"
                  style={{
                    left: `${currentRoundX}px`,
                    top: `${match1Y + cardHeight / 2}px`,
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
                      top: `${match2Y + cardHeight / 2}px`,
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
                      top: `${Math.min(match1Y, match2Y) + cardHeight / 2}px`,
                      height: `${Math.abs(match2Y - match1Y)}px`,
                    }}
                  />
                );
              }

              // Line to next round match
              lines.push(
                <div
                  key={`next-${roundNum}-${i}`}
                  className="absolute bg-white/40 h-0.5"
                  style={{
                    left: `${centerX}px`,
                    top: `${nextMatchY + cardHeight / 2}px`,
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
            const matchY = getMatchY(roundIndex, matchIndex, matches);

            return (
              <div
                key={match.id}
                className="absolute bg-neutral-800 rounded-lg border border-white/10 shadow-lg hover:shadow-xl transition-shadow"
                style={{
                  top: `${matchY}px`,
                  left: `${roundIndex * roundSpacing + 20}px`,
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                }}
              >
                <div className="p-3 space-y-2 h-full flex flex-col justify-center">
                  {/* QB 1 */}
                  <button
                    onClick={() => handleWinnerSelection(match.id, match.qb1)}
                    disabled={match.qb1.id === 'bye'}
                    className={`w-full p-2 rounded-lg border-2 transition-all text-sm relative ${
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
                    <div className="text-xs text-white/60 truncate">
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
                    className={`w-full p-2 rounded-lg border-2 transition-all text-sm relative ${
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
                    <div className="text-xs text-white/60 truncate">
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

export default TournamentBracket;