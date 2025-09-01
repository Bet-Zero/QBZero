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

  return (
    <div className="w-full bg-neutral-900 rounded-lg overflow-hidden">
      <div className="p-4">
        {/* Horizontal scrollable container for the tournament bracket */}
        <div className="overflow-x-auto overflow-y-hidden">
          <div className="flex gap-8 min-w-max py-8 px-4">
            {rounds.map((roundNum, roundIndex) => {
              const matches = roundsData[roundNum] || [];
              
              return (
                <div key={`round-${roundNum}`} className="flex flex-col items-center min-w-0">
                  {/* Round header */}
                  <div className="mb-6 text-center">
                    <h3 className="text-sm font-bold text-white bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg py-2 px-4 border border-white/10 whitespace-nowrap">
                      {roundNames[roundNum] || `Round ${roundNum + 1}`}
                    </h3>
                  </div>

                  {/* Round matches */}
                  <div className="flex flex-col justify-center space-y-4 flex-1">
                    {matches.map((match, matchIndex) => {
                      const isPlaceholder = match.qb1?.name === 'TBD' || match.qb2?.name === 'TBD';
                      
                      return (
                        <div
                          key={match.id}
                          className={`w-48 rounded border shadow-lg transition-all ${
                            isPlaceholder 
                              ? 'bg-neutral-700/50 border-white/10' 
                              : 'bg-neutral-800 border-white/20 hover:shadow-xl hover:border-white/40'
                          }`}
                          style={{
                            // Add extra spacing for later rounds to center them vertically
                            marginTop: roundIndex > 0 ? `${Math.pow(2, roundIndex - 1) * 16}px` : '0px',
                            marginBottom: roundIndex > 0 ? `${Math.pow(2, roundIndex - 1) * 16}px` : '0px',
                          }}
                        >
                          <div className="h-full flex flex-col">
                            {/* QB 1 */}
                            <button
                              onClick={() => handleWinnerSelection(match.id, match.qb1)}
                              disabled={match.qb1?.id === 'bye' || match.qb1?.name === 'TBD'}
                              className={`flex-1 px-3 py-2 transition-all text-left relative border-b border-white/10 ${
                                match.winner?.id === match.qb1?.id
                                  ? 'bg-green-500/30 text-green-300 hover:bg-red-400/20'
                                  : match.qb1?.id === 'bye' || match.qb1?.name === 'TBD'
                                    ? 'bg-gray-500/20 cursor-not-allowed text-gray-400'
                                    : 'hover:bg-blue-400/20 cursor-pointer text-white'
                              }`}
                              title={match.winner?.id === match.qb1?.id ? 'Click to deselect' : ''}
                            >
                              <div className="font-semibold truncate text-sm leading-tight">
                                {match.qb1?.name || 'TBD'}
                              </div>
                              <div className="text-white/60 truncate text-xs leading-tight">
                                {match.qb1?.team || ''}
                              </div>
                              {match.winner?.id === match.qb1?.id && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-sm">
                                  ✓
                                </div>
                              )}
                            </button>

                            {/* QB 2 */}
                            <button
                              onClick={() => handleWinnerSelection(match.id, match.qb2)}
                              disabled={match.qb2?.id === 'bye' || match.qb2?.name === 'TBD'}
                              className={`flex-1 px-3 py-2 transition-all text-left relative ${
                                match.winner?.id === match.qb2?.id
                                  ? 'bg-green-500/30 text-green-300 hover:bg-red-400/20'
                                  : match.qb2?.id === 'bye' || match.qb2?.name === 'TBD'
                                    ? 'bg-gray-500/20 cursor-not-allowed text-gray-400'
                                    : 'hover:bg-blue-400/20 cursor-pointer text-white'
                              }`}
                              title={match.winner?.id === match.qb2?.id ? 'Click to deselect' : ''}
                            >
                              <div className="font-semibold truncate text-sm leading-tight">
                                {match.qb2?.name || 'TBD'}
                              </div>
                              <div className="text-white/60 truncate text-xs leading-tight">
                                {match.qb2?.team || ''}
                              </div>
                              {match.winner?.id === match.qb2?.id && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-sm">
                                  ✓
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Connecting lines to next round */}
                  {roundIndex < rounds.length - 1 && (
                    <div className="absolute left-full top-1/2 transform -translate-y-1/2 z-0">
                      <div className="w-8 h-0.5 bg-blue-400/60"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentBracket;