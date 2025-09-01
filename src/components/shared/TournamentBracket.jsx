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
    if (!match || selectedQB.id === 'placeholder' || selectedQB.name === 'TBD') return;

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

  // Calculate responsive bracket dimensions that fit on screen
  const MATCH_WIDTH = 160;
  const MATCH_HEIGHT = 60;
  const ROUND_GAP = 60;
  const MATCH_GAP = 8;

  // Get viewport dimensions
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth - 100 : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight - 200 : 800;

  // Calculate total width needed and scale if necessary
  const totalWidth = rounds.length * (MATCH_WIDTH + ROUND_GAP);
  const widthScale = Math.min(1, viewportWidth / totalWidth);
  
  // Calculate height scale based on first round matches
  const firstRoundMatchCount = roundsData[0]?.length || 16;
  const totalHeight = firstRoundMatchCount * (MATCH_HEIGHT + MATCH_GAP);
  const heightScale = Math.min(1, viewportHeight / totalHeight);
  
  // Use the smaller scale to ensure everything fits
  const scale = Math.min(widthScale, heightScale, 0.9);

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
      y: (firstParentPos.y + lastParentPos.y) / 2 + (scaledMatchHeight / 2)
    };
  };

  // Calculate bracket container dimensions
  const bracketHeight = Math.max(400, firstRoundMatchCount * (scaledMatchHeight + scaledMatchGap) + 100);
  const bracketWidth = totalWidth * scale + 100;

  return (
    <div className="w-full bg-neutral-900 rounded-lg overflow-hidden">
      <div className="p-4">
        <div 
          className="relative mx-auto bg-neutral-800/50 rounded-lg p-4"
          style={{ 
            width: `${Math.min(bracketWidth, viewportWidth)}px`,
            height: `${Math.min(bracketHeight, viewportHeight)}px`,
            overflow: 'hidden'
          }}
        >
          {/* Render bracket lines first (behind matches) */}
          {rounds.map((roundNum, roundIndex) => {
            if (roundIndex >= rounds.length - 1) return null; // No lines from final round
            
            const matches = roundsData[roundNum] || [];
            
            return (
              <div key={`lines-${roundNum}`}>
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
                  
                  const lineStartX = match1Pos.x + scaledMatchWidth;
                  const lineEndX = nextMatchPos.x;
                  const centerX = (lineStartX + lineEndX) / 2;
                  
                  const match1CenterY = match1Pos.y + scaledMatchHeight / 2;
                  const match2CenterY = match2Pos.y + scaledMatchHeight / 2;
                  const nextMatchCenterY = nextMatchPos.y + scaledMatchHeight / 2;
                  
                  return (
                    <div key={`line-${roundIndex}-${matchIndex}`}>
                      {/* Horizontal line from match 1 */}
                      <div
                        className="absolute bg-blue-400/60 h-0.5"
                        style={{
                          left: `${lineStartX}px`,
                          top: `${match1CenterY}px`,
                          width: `${centerX - lineStartX}px`,
                        }}
                      />
                      
                      {/* Horizontal line from match 2 (if exists) */}
                      {matchIndex + 1 < matches.length && (
                        <div
                          className="absolute bg-blue-400/60 h-0.5"
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
                          className="absolute bg-blue-400/60 w-0.5"
                          style={{
                            left: `${centerX}px`,
                            top: `${Math.min(match1CenterY, match2CenterY)}px`,
                            height: `${Math.abs(match2CenterY - match1CenterY)}px`,
                          }}
                        />
                      )}
                      
                      {/* Horizontal line to next match */}
                      <div
                        className="absolute bg-blue-400/60 h-0.5"
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
            );
          })}

          {/* Render each round */}
          {rounds.map((roundNum, roundIndex) => {
            const matches = roundsData[roundNum] || [];
            
            return (
              <div key={`round-${roundNum}`}>
                {/* Round header */}
                <div
                  className="absolute text-center z-10"
                  style={{
                    left: `${roundIndex * (scaledMatchWidth + scaledRoundGap)}px`,
                    top: '-30px',
                    width: `${scaledMatchWidth}px`,
                  }}
                >
                  <h3 
                    className="text-xs font-bold text-white bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg py-1 px-2 border border-white/10"
                    style={{ fontSize: `${Math.max(10, 10 * scale)}px` }}
                  >
                    {roundNames[roundNum] || `Round ${roundNum + 1}`}
                  </h3>
                </div>

                {/* Round matches */}
                {matches.map((match, matchIndex) => {
                  const position = getMatchPosition(roundIndex, matchIndex);
                  const isPlaceholder = match.qb1?.name === 'TBD' || match.qb2?.name === 'TBD';
                  
                  return (
                    <div
                      key={match.id}
                      className={`absolute rounded border shadow-lg transition-all z-20 ${
                        isPlaceholder 
                          ? 'bg-neutral-700/50 border-white/10' 
                          : 'bg-neutral-800 border-white/20 hover:shadow-xl hover:border-white/40'
                      }`}
                      style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        width: `${scaledMatchWidth}px`,
                        height: `${scaledMatchHeight}px`,
                      }}
                    >
                      <div className="h-full flex flex-col">
                        {/* QB 1 */}
                        <button
                          onClick={() => handleWinnerSelection(match.id, match.qb1)}
                          disabled={match.qb1?.id === 'bye' || match.qb1?.name === 'TBD'}
                          className={`flex-1 px-2 py-1 transition-all text-left relative border-b border-white/10 text-xs ${
                            match.winner?.id === match.qb1?.id
                              ? 'bg-green-500/30 text-green-300 hover:bg-red-400/20'
                              : match.qb1?.id === 'bye' || match.qb1?.name === 'TBD'
                                ? 'bg-gray-500/20 cursor-not-allowed text-gray-400'
                                : 'hover:bg-blue-400/20 cursor-pointer text-white'
                          }`}
                          title={match.winner?.id === match.qb1?.id ? 'Click to deselect' : ''}
                        >
                          <div 
                            className="font-semibold truncate leading-tight"
                            style={{ fontSize: `${Math.max(8, 9 * scale)}px` }}
                          >
                            {match.qb1?.name || 'TBD'}
                          </div>
                          <div 
                            className="text-white/60 truncate leading-tight"
                            style={{ fontSize: `${Math.max(7, 7 * scale)}px` }}
                          >
                            {match.qb1?.team || ''}
                          </div>
                          {match.winner?.id === match.qb1?.id && (
                            <div 
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-green-400"
                              style={{ fontSize: `${Math.max(10, 12 * scale)}px` }}
                            >
                              ✓
                            </div>
                          )}
                        </button>

                        {/* QB 2 */}
                        <button
                          onClick={() => handleWinnerSelection(match.id, match.qb2)}
                          disabled={match.qb2?.id === 'bye' || match.qb2?.name === 'TBD'}
                          className={`flex-1 px-2 py-1 transition-all text-left relative text-xs ${
                            match.winner?.id === match.qb2?.id
                              ? 'bg-green-500/30 text-green-300 hover:bg-red-400/20'
                              : match.qb2?.id === 'bye' || match.qb2?.name === 'TBD'
                                ? 'bg-gray-500/20 cursor-not-allowed text-gray-400'
                                : 'hover:bg-blue-400/20 cursor-pointer text-white'
                          }`}
                          title={match.winner?.id === match.qb2?.id ? 'Click to deselect' : ''}
                        >
                          <div 
                            className="font-semibold truncate leading-tight"
                            style={{ fontSize: `${Math.max(8, 9 * scale)}px` }}
                          >
                            {match.qb2?.name || 'TBD'}
                          </div>
                          <div 
                            className="text-white/60 truncate leading-tight"
                            style={{ fontSize: `${Math.max(7, 7 * scale)}px` }}
                          >
                            {match.qb2?.team || ''}
                          </div>
                          {match.winner?.id === match.qb2?.id && (
                            <div 
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-green-400"
                              style={{ fontSize: `${Math.max(10, 12 * scale)}px` }}
                            >
                              ✓
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TournamentBracket;