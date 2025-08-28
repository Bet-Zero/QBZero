import React from 'react';

const TournamentBracket = ({ bracket = [], selectWinner, roundNames = [] }) => {
  // Group matches by round
  const getMatchesByRound = () => {
    const rounds = {};
    bracket.forEach(match => {
      if (!rounds[match.round]) {
        rounds[match.round] = [];
      }
      rounds[match.round].push(match);
    });
    return rounds;
  };

  const roundsData = getMatchesByRound();
  const maxRound = Math.max(...Object.keys(roundsData).map(Number));

  // Calculate positioning for bracket layout
  const getMatchPosition = (roundIndex, matchIndex, totalMatches) => {
    const baseSpacing = 140; // Base spacing between matches
    const roundMultiplier = Math.pow(2, roundIndex); // Spacing increases each round
    const spacing = baseSpacing * roundMultiplier;
    const startOffset = (roundMultiplier - 1) * baseSpacing / 2;
    
    return {
      marginTop: startOffset + (matchIndex * spacing),
    };
  };

  // Render a single match
  const renderMatch = (match, roundIndex, matchIndex, totalMatches) => {
    const position = getMatchPosition(roundIndex, matchIndex, totalMatches);
    
    return (
      <div
        key={match.id}
        className="w-64 bg-neutral-800 rounded-lg border border-white/10 p-3 mb-4 relative"
        style={{ marginTop: `${position.marginTop}px` }}
      >
        <div className="space-y-2">
          {/* QB 1 */}
          <button
            onClick={() => selectWinner(match.id, match.qb1)}
            disabled={match.winner || match.qb1.id === 'bye'}
            className={`w-full p-3 rounded-lg border-2 transition-all text-sm relative ${
              match.winner?.id === match.qb1.id
                ? 'border-green-500 bg-green-500/20 text-green-300'
                : match.qb1.id === 'bye'
                ? 'border-gray-500 bg-gray-500/20 cursor-not-allowed'
                : 'border-white/20 hover:border-blue-400 hover:bg-blue-400/10 cursor-pointer'
            }`}
          >
            <div className="font-semibold">{match.qb1.name}</div>
            <div className="text-xs text-white/60">{match.qb1.team}</div>
            {match.winner?.id === match.qb1.id && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400">
                ✓
              </div>
            )}
          </button>

          <div className="text-center text-white/40 text-xs font-bold py-1">VS</div>

          {/* QB 2 */}
          <button
            onClick={() => selectWinner(match.id, match.qb2)}
            disabled={match.winner || match.qb2.id === 'bye'}
            className={`w-full p-3 rounded-lg border-2 transition-all text-sm relative ${
              match.winner?.id === match.qb2.id
                ? 'border-green-500 bg-green-500/20 text-green-300'
                : match.qb2.id === 'bye'
                ? 'border-gray-500 bg-gray-500/20 cursor-not-allowed'
                : 'border-white/20 hover:border-blue-400 hover:bg-blue-400/10 cursor-pointer'
            }`}
          >
            <div className="font-semibold">{match.qb2.name}</div>
            <div className="text-xs text-white/60">{match.qb2.team}</div>
            {match.winner?.id === match.qb2.id && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400">
                ✓
              </div>
            )}
          </button>
        </div>
        
        {/* Connector line */}
        {roundIndex < Object.keys(roundsData).length - 1 && (
          <div className="absolute right-0 top-1/2 w-6 h-0.5 bg-white/20 transform -translate-y-1/2"></div>
        )}
      </div>
    );
  };

  if (Object.keys(roundsData).length === 0) {
    return (
      <div className="text-center text-white/60 py-8">
        No tournament data available
      </div>
    );
  }

  return (
    <div className="tournament-bracket overflow-x-auto pb-8">
      <div className="flex gap-12 min-w-max px-4">
        {/* Render each round */}
        {Object.keys(roundsData)
          .sort((a, b) => Number(a) - Number(b))
          .map((roundKey, roundIndex) => {
            const round = Number(roundKey);
            const matches = roundsData[round];
            
            return (
              <div key={round} className="flex-shrink-0 w-72">
                {/* Round header */}
                <div className="mb-6 text-center">
                  <h3 className="text-lg font-bold text-white bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg py-3 px-4 border border-white/10 shadow-lg">
                    {roundNames[round] || `Round ${round + 1}`}
                  </h3>
                  <div className="text-xs text-white/50 mt-1">
                    {matches.filter(m => m.winner).length} / {matches.length} complete
                  </div>
                </div>
                
                {/* Matches in this round */}
                <div className="space-y-2">
                  {matches.map((match, matchIndex) =>
                    renderMatch(match, round, matchIndex, matches.length)
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default TournamentBracket;