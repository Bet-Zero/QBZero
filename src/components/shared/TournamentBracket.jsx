import React, { useState, useEffect, useRef } from 'react';

const TournamentBracket = ({ bracket = [], selectWinner, roundNames = [] }) => {
  const [focusRound, setFocusRound] = useState(0);
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const containerRef = useRef(null);

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

  // Get current active round (first round with incomplete matches)
  const getCurrentActiveRound = () => {
    for (let i = 0; i < rounds.length; i++) {
      const roundMatches = roundsData[rounds[i]] || [];
      const completedMatches = roundMatches.filter(m => m.winner);
      if (completedMatches.length < roundMatches.length) {
        return i;
      }
    }
    return rounds.length - 1; // Tournament complete, show final
  };

  // Auto-focus on current active round
  useEffect(() => {
    const activeRound = getCurrentActiveRound();
    setFocusRound(activeRound);
  }, [bracket]);

  // Dynamic zoom calculation based on focus round
  useEffect(() => {
    if (!containerRef.current || rounds.length === 0) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Show focused round + 1-2 surrounding rounds
    const visibleRounds = [];
    const startRound = Math.max(0, focusRound - 1);
    const endRound = Math.min(rounds.length - 1, focusRound + 2);
    
    for (let i = startRound; i <= endRound; i++) {
      visibleRounds.push(i);
    }

    // Calculate dimensions for visible rounds only
    const baseMatchWidth = 200;
    const baseGap = 40;
    const totalWidth = visibleRounds.length * baseMatchWidth + (visibleRounds.length - 1) * baseGap + 80;

    // Calculate height based on the round with most matches in visible area
    let maxMatches = 0;
    visibleRounds.forEach(roundIndex => {
      const roundNum = rounds[roundIndex];
      const matches = roundsData[roundNum] || [];
      maxMatches = Math.max(maxMatches, matches.length);
    });

    const baseMatchHeight = 80;
    const baseSpacing = 16;
    const totalHeight = maxMatches * baseMatchHeight + (maxMatches - 1) * baseSpacing + 120;

    // Calculate optimal scale for visible rounds
      const widthScale = Math.min(1.2, containerWidth / totalWidth);
      const heightScale = Math.min(1.2, containerHeight / totalHeight);
      const optimalScale = Math.min(widthScale, heightScale);

      setScale(optimalScale);

    // Calculate pan to center the focused round
    const focusRoundIndex = visibleRounds.indexOf(focusRound);
    if (focusRoundIndex !== -1) {
      const targetX = -(focusRoundIndex * (baseMatchWidth + baseGap)) + containerWidth / 2 - baseMatchWidth / 2;
      setPanX(targetX * optimalScale);
    }
    
    setPanY(0); // Center vertically
  }, [focusRound, rounds.length, roundsData]);

  // Enhanced winner selection
  const handleWinnerSelection = (matchId, selectedQB) => {
    const match = bracket.find((m) => m.id === matchId);
    if (!match || selectedQB.id === 'placeholder' || selectedQB.name === 'TBD') return;

    if (match.winner && match.winner.id === selectedQB.id) {
      selectWinner(matchId, null);
      return;
    }

    selectWinner(matchId, selectedQB);
  };

  // Manual round navigation
  const goToRound = (roundIndex) => {
    setFocusRound(Math.max(0, Math.min(rounds.length - 1, roundIndex)));
  };

  if (rounds.length === 0) {
    return (
      <div className="text-center text-white/60 py-8">
        No tournament data available
      </div>
    );
  }

  const activeRound = getCurrentActiveRound();

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-neutral-900 rounded-lg overflow-hidden relative"
    >
      {/* Round Navigation */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center gap-2 bg-neutral-800/90 backdrop-blur-sm rounded-lg p-2 border border-white/10">
          <button
            onClick={() => goToRound(focusRound - 1)}
            disabled={focusRound === 0}
            className="p-2 hover:bg-white/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ←
          </button>
          
          <div className="flex gap-1">
            {rounds.map((roundNum, index) => {
              const roundMatches = roundsData[roundNum] || [];
              const completedMatches = roundMatches.filter(m => m.winner);
              const isActive = index === activeRound;
              const isFocused = index === focusRound;
              
              return (
                <button
                  key={roundNum}
                  onClick={() => goToRound(index)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                    isFocused
                      ? 'bg-blue-600 text-white'
                      : isActive
                        ? 'bg-yellow-600/80 text-white'
                        : completedMatches.length === roundMatches.length
                          ? 'bg-green-600/60 text-white'
                          : 'bg-neutral-600/60 text-white/70 hover:bg-neutral-500/60'
                  }`}
                >
                  {roundNames[roundNum] || `R${index + 1}`}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => goToRound(focusRound + 1)}
            disabled={focusRound === rounds.length - 1}
            className="p-2 hover:bg-white/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>
      </div>

      {/* Auto-advance notification */}
      {focusRound !== activeRound && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20">
          <button
            onClick={() => setFocusRound(activeRound)}
            className="px-4 py-2 bg-yellow-600/90 hover:bg-yellow-600 text-white text-sm rounded-lg border border-yellow-500/50 backdrop-blur-sm"
          >
            Jump to Active Round →
          </button>
        </div>
      )}

      {/* Tournament Bracket with Dynamic Zoom */}
      <div className="h-full w-full overflow-hidden relative">
        <div 
          className="absolute inset-0 transition-transform duration-500 ease-out"
          style={{ 
            transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
            transformOrigin: 'center center'
          }}
        >
          <div className="flex gap-10 items-center justify-center h-full px-8">
            {rounds.map((roundNum, roundIndex) => {
              const matches = roundsData[roundNum] || [];
              const isVisible = Math.abs(roundIndex - focusRound) <= 2; // Show focus + 2 rounds on each side
              
              if (!isVisible) return null;
              
              return (
                <div 
                  key={`round-${roundNum}`} 
                  className={`flex flex-col items-center transition-opacity duration-300 ${
                    roundIndex === focusRound ? 'opacity-100' : 'opacity-60'
                  }`}
                >
                  {/* Round header */}
                  <div className="mb-6 text-center">
                    <h3 className={`text-sm font-bold text-white rounded-lg py-2 px-4 border whitespace-nowrap ${
                      roundIndex === focusRound
                        ? 'bg-blue-600/40 border-blue-400/50'
                        : roundIndex === activeRound
                          ? 'bg-yellow-600/30 border-yellow-400/50'
                          : 'bg-neutral-600/30 border-white/10'
                    }`}>
                      {roundNames[roundNum] || `Round ${roundNum + 1}`}
                    </h3>
                  </div>

                  {/* Round matches */}
                  <div className="flex flex-col justify-center space-y-4 flex-1">
                    {matches.map((match, matchIndex) => {
                      const isPlaceholder = match.qb1?.name === 'TBD' || match.qb2?.name === 'TBD';
                      const isChampionship = roundIndex === rounds.length - 1;
                      
                      return (
                        <div
                          key={match.id}
                          className={`rounded border shadow-lg transition-all ${
                            isChampionship ? 'w-64' : 'w-52'
                          } ${
                            isPlaceholder 
                              ? 'bg-neutral-700/50 border-white/10' 
                              : isChampionship
                                ? 'bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-yellow-500/50 hover:border-yellow-400/70'
                                : 'bg-neutral-800 border-white/20 hover:shadow-xl hover:border-white/40'
                          }`}
                          style={{
                            marginTop: roundIndex > 0 ? `${Math.pow(2, roundIndex - 1) * 20}px` : '0px',
                            marginBottom: roundIndex > 0 ? `${Math.pow(2, roundIndex - 1) * 20}px` : '0px',
                          }}
                        >
                          <div className="h-full flex flex-col">
                            {/* QB 1 */}
                            <button
                              onClick={() => handleWinnerSelection(match.id, match.qb1)}
                              disabled={match.qb1?.id === 'bye' || match.qb1?.name === 'TBD'}
                              className={`flex-1 px-4 py-3 transition-all text-left relative border-b border-white/10 ${
                                match.winner?.id === match.qb1?.id
                                  ? 'bg-green-500/30 text-green-300 hover:bg-red-400/20'
                                  : match.qb1?.id === 'bye' || match.qb1?.name === 'TBD'
                                    ? 'bg-gray-500/20 cursor-not-allowed text-gray-400'
                                    : isChampionship
                                      ? 'hover:bg-yellow-400/20 cursor-pointer text-white'
                                      : 'hover:bg-blue-400/20 cursor-pointer text-white'
                              }`}
                            >
                              <div className={`font-semibold truncate ${
                                isChampionship ? 'text-base' : 'text-sm'
                              }`}>
                                {match.qb1?.name || 'TBD'}
                              </div>
                              <div className="text-white/60 truncate text-xs">
                                {match.qb1?.team || ''}
                              </div>
                              {match.winner?.id === match.qb1?.id && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400">
                                  {isChampionship ? '👑' : '✓'}
                                </div>
                              )}
                            </button>

                            {/* QB 2 */}
                            <button
                              onClick={() => handleWinnerSelection(match.id, match.qb2)}
                              disabled={match.qb2?.id === 'bye' || match.qb2?.name === 'TBD'}
                              className={`flex-1 px-4 py-3 transition-all text-left relative ${
                                match.winner?.id === match.qb2?.id
                                  ? 'bg-green-500/30 text-green-300 hover:bg-red-400/20'
                                  : match.qb2?.id === 'bye' || match.qb2?.name === 'TBD'
                                    ? 'bg-gray-500/20 cursor-not-allowed text-gray-400'
                                    : isChampionship
                                      ? 'hover:bg-yellow-400/20 cursor-pointer text-white'
                                      : 'hover:bg-blue-400/20 cursor-pointer text-white'
                              }`}
                            >
                              <div className={`font-semibold truncate ${
                                isChampionship ? 'text-base' : 'text-sm'
                              }`}>
                                {match.qb2?.name || 'TBD'}
                              </div>
                              <div className="text-white/60 truncate text-xs">
                                {match.qb2?.team || ''}
                              </div>
                              {match.winner?.id === match.qb2?.id && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400">
                                  {isChampionship ? '👑' : '✓'}
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Connecting lines */}
                  {roundIndex < rounds.length - 1 && (
                    <div className="absolute left-full top-1/2 transform -translate-y-1/2 z-0">
                      <div className="w-10 h-0.5 bg-blue-400/60"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute bottom-4 right-4 text-xs text-white/60 bg-neutral-800/80 px-3 py-1 rounded backdrop-blur-sm">
        Zoom: {Math.round(scale * 100)}% | Round {focusRound + 1} of {rounds.length}
      </div>
    </div>
  );
};

export default TournamentBracket;