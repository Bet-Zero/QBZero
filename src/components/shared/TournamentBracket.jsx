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

  if (rounds.length === 0) {
    return (
      <div className="text-center text-white/60 py-8">
        No tournament data available
      </div>
    );
  }

  // Calculate bracket dimensions that fit on screen
  const MATCH_WIDTH = 180;
  const MATCH_HEIGHT = 80;
  const ROUND_GAP = 100;
  const MATCH_GAP = 20;

  // Calculate total width and ensure it fits within viewport
  const totalWidth = rounds.length * (MATCH_WIDTH + ROUND_GAP);
  const maxViewportWidth = typeof window !== 'undefined' ? window.innerWidth - 100 : 1200;
  const scale = Math.min(1, maxViewportWidth / totalWidth);

  const scaledMatchWidth = MATCH_WIDTH * scale;
  const scaledMatchHeight = MATCH_HEIGHT * scale;
  const scaledRoundGap = ROUND_GAP * scale;
  const scaledMatchGap = MATCH_GAP * scale;

  // Calculate match positions for proper bracket flow
  const getMatchPosition = (roundIndex, matchIndex) => {
    const x = roundIndex * (scaledMatchWidth + scaledRoundGap);
    
    if (roundIndex === 0) {
      // First round: evenly spaced
      return {
        x,
        y: matchIndex * (scaledMatchHeight + scaledMatchGap)
      };
    }
    
    // Later rounds: position between parent matches
    const previousRound = roundsData[roundIndex - 1] || [];
    const matchesPerParent = previousRound.length / (roundsData[roundIndex]?.length || 1);
    const firstParentIndex = matchIndex * matchesPerParent;
    const lastParentIndex = firstParentIndex + matchesPerParent - 1;
    
    const firstParentPos = getMatchPosition(roundIndex - 1, firstParentIndex);
    const lastParentPos = getMatchPosition(roundIndex - 1, lastParentIndex);
    
    return {
      x,
      y: (firstParentPos.y + lastParentPos.y) / 2
    };
  };

  // Calculate bracket container dimensions
  const firstRoundMatches = roundsData[0]?.length || 0;
  const bracketHeight = Math.max(400, firstRoundMatches * (scaledMatchHeight + scaledMatchGap) + 100);
  const bracketWidth = totalWidth * scale + 50;

  return (
    <div className="w-full bg-neutral-900 rounded-lg">
      <div className="p-4 overflow-auto">
        <div 
          className="relative mx-auto"
          style={{ 
            width: `${bracketWidth}px`,
            height: `${bracketHeight}px`,
            minWidth: '100%'
          }}
        >
          {/* Render each round */}
          {rounds.map((roundNum, roundIndex) => {
            const matches = roundsData[roundNum] || [];
            
            return (
              <div key={`round-${roundNum}`}>
                {/* Round header */}
                <div
                  className="absolute text-center"
                  style={{
                    left: `${roundIndex * (scaledMatchWidth + scaledRoundGap)}px`,
                    top: '10px',
                    width: `${scaledMatchWidth}px`,
                  }}
                >
                  <h3 
                    className="text-sm font-bold text-white bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg py-1 px-2 border border-white/10"
                    style={{ fontSize: `${12 * scale}px` }}
                  >
                    {roundNames[roundNum] || `Round ${roundNum + 1}`}
                  </h3>
                  <div 
                    className="text-white/50 mt-1"
                    style={{ fontSize: `${10 * scale}px` }}
                  >
                    {matches.filter((m) => m.winner).length} / {matches.length} complete
                  </div>
                </div>

                {/* Round matches */}
                {matches.map((match, matchIndex) => {
                  const position = getMatchPosition(roundIndex, matchIndex);
                  
                  return (
                    <div
                      key={match.id}
                      className="absolute bg-neutral-800 rounded border border-white/20 shadow-lg hover:shadow-xl transition-all hover:border-white/40"
                      style={{
                        left: `${position.x + 25}px`,
                        top: `${position.y + 60}px`,
                        width: `${scaledMatchWidth}px`,
                        height: `${scaledMatchHeight}px`,
                      }}
                    >
                      <div className="h-full flex flex-col">
                        {/* QB 1 */}
                        <button
                          onClick={() => handleWinnerSelection(match.id, match.qb1)}
                          disabled={match.qb1.id === 'bye'}
                          className={`flex-1 px-2 py-1 transition-all text-left relative border-b border-white/10 ${
                            match.winner?.id === match.qb1.id
                              ? 'bg-green-500/30 text-green-300 hover:bg-red-400/20'
                              : match.qb1.id === 'bye'
                                ? 'bg-gray-500/20 cursor-not-allowed text-gray-400'
                                : 'hover:bg-blue-400/20 cursor-pointer'
                          }`}
                          title={match.winner?.id === match.qb1.id ? 'Click to deselect' : ''}
                        >
                          <div 
                            className="font-semibold truncate"
                            style={{ fontSize: `${11 * scale}px` }}
                          >
                            {match.qb1.name}
                          </div>
                          <div 
                            className="text-white/60 truncate"
                            style={{ fontSize: `${9 * scale}px` }}
                          >
                            {match.qb1.team}
                          </div>
                          {match.winner?.id === match.qb1.id && (
                            <div 
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-green-400"
                              style={{ fontSize: `${14 * scale}px` }}
                            >
                              ✓
                            </div>
                          )}
                        </button>

                        {/* QB 2 */}
                        <button
                          onClick={() => handleWinnerSelection(match.id, match.qb2)}
                          disabled={match.qb2.id === 'bye'}
                          className={`flex-1 px-2 py-1 transition-all text-left relative ${
                            match.winner?.id === match.qb2.id
                              ? 'bg-green-500/30 text-green-300 hover:bg-red-400/20'
                              : match.qb2.id === 'bye'
                                ? 'bg-gray-500/20 cursor-not-allowed text-gray-400'
                                : 'hover:bg-blue-400/20 cursor-pointer'
                          }`}
                          title={match.winner?.id === match.qb2.id ? 'Click to deselect' : ''}
                        >
                          <div 
                            className="font-semibold truncate"
                            style={{ fontSize: `${11 * scale}px` }}
                          >
                            {match.qb2.name}
                          </div>
                          <div 
                            className="text-white/60 truncate"
                            style={{ fontSize: `${9 * scale}px` }}
                          >
                            {match.qb2.team}
                          </div>
                          {match.winner?.id === match.qb2.id && (
                            <div 
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-green-400"
                              style={{ fontSize: `${14 * scale}px` }}
                            >
                              ✓
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Connecting lines to next round */}
                {roundIndex < rounds.length - 1 && (
                  <div>
                    {matches.map((match, matchIndex) => {
                      // Only draw lines for pairs of matches
                      if (matchIndex % 2 !== 0) return null;
                      
                      const nextRoundMatches = roundsData[roundIndex + 1] || [];
                      const nextMatchIndex = Math.floor(matchIndex / 2);
                      
                      if (nextMatchIndex >= nextRoundMatches.length) return null;
                      
                      const match1Pos = getMatchPosition(roundIndex, matchIndex);
                      const match2Pos = matchIndex + 1 < matches.length 
                        ? getMatchPosition(roundIndex, matchIndex + 1)
                        : match1Pos;
                      const nextMatchPos = getMatchPosition(roundIndex + 1, nextMatchIndex);
                      
                      const lineStartX = match1Pos.x + scaledMatchWidth + 25;
                      const lineEndX = nextMatchPos.x + 25;
                      const centerX = (lineStartX + lineEndX) / 2;
                      
                      const match1CenterY = match1Pos.y + scaledMatchHeight / 2 + 60;
                      const match2CenterY = match2Pos.y + scaledMatchHeight / 2 + 60;
                      const nextMatchCenterY = nextMatchPos.y + scaledMatchHeight / 2 + 60;
                      
                      return (
                        <div key={`line-${roundIndex}-${matchIndex}`}>
                          {/* Horizontal line from match 1 */}
                          <div
                            className="absolute bg-white/30 h-0.5"
                            style={{
                              left: `${lineStartX}px`,
                              top: `${match1CenterY}px`,
                              width: `${centerX - lineStartX}px`,
                            }}
                          />
                          
                          {/* Horizontal line from match 2 (if exists) */}
                          {matchIndex + 1 < matches.length && (
                            <div
                              className="absolute bg-white/30 h-0.5"
                              style={{
                                left: `${lineStartX}px`,
                                top: `${match2CenterY}px`,
                                width: `${centerX - lineStartX}px`,
                              }}
                            />
                          )}
                          
                          {/* Vertical connecting line */}
                          {matchIndex + 1 < matches.length && (
                            <div
                              className="absolute bg-white/30 w-0.5"
                              style={{
                                left: `${centerX}px`,
                                top: `${Math.min(match1CenterY, match2CenterY)}px`,
                                height: `${Math.abs(match2CenterY - match1CenterY)}px`,
                              }}
                            />
                          )}
                          
                          {/* Horizontal line to next match */}
                          <div
                            className="absolute bg-white/30 h-0.5"
                            style={{
                              left: `${centerX}px`,
                              top: `${nextMatchCenterY}px`,
                              width: `${lineEndX - centerX}px`,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TournamentBracket;