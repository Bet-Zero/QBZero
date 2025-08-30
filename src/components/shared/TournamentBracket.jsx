import React, { useState, useEffect } from 'react';

const TournamentBracket = ({ bracket = [], selectWinner, roundNames = [] }) => {
  const [showCompactView, setShowCompactView] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200); // Default to a reasonable width
  const [currentRegion, setCurrentRegion] = useState(0);
  const [showRegionView, setShowRegionView] = useState(true); // Default to new region-based view

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
  const totalRounds = Object.keys(roundsData).length;

  // Region-based logic for better navigation
  const REGIONS = 4; // 4 regions for 32 QBs
  const QBS_PER_REGION = 8; // 8 QBs per region (4 matches)
  const MATCHES_PER_REGION = 4; // 4 matches per region

  // Get matches for specific region and round
  const getRegionMatches = (round, region) => {
    const roundMatches = roundsData[round] || [];
    
    // For first round, divide into regions
    if (round === 0) {
      const startIndex = region * MATCHES_PER_REGION;
      const endIndex = startIndex + MATCHES_PER_REGION;
      return roundMatches.slice(startIndex, endIndex);
    }
    
    // For subsequent rounds, calculate which matches belong to this region
    // Each subsequent round has fewer matches, so we need to map them properly
    const matchesInRound = Math.max(1, 16 / Math.pow(2, round)); // 16, 8, 4, 2, 1
    const matchesPerRegion = Math.max(1, matchesInRound / REGIONS);
    
    if (matchesInRound <= 4) {
      // Final 4 or fewer - show all matches
      return roundMatches;
    }
    
    const startIndex = Math.floor(region * matchesPerRegion);
    const endIndex = Math.min(roundMatches.length, Math.ceil((region + 1) * matchesPerRegion));
    return roundMatches.slice(startIndex, endIndex);
  };

  // Get current active round (first round with incomplete matches)
  const getCurrentActiveRound = () => {
    return Object.keys(roundsData)
      .map(Number)
      .find(round => {
        const matches = roundsData[round] || [];
        return matches.some(m => !m.winner);
      }) || 0;
  };

  // Check if current region is complete
  const isRegionComplete = (round, region) => {
    const regionMatches = getRegionMatches(round, region);
    return regionMatches.length > 0 && regionMatches.every(m => m.winner);
  };

  // Auto-advance to next region when current is complete
  const getNextRegion = (round, region) => {
    const activeRound = getCurrentActiveRound();
    
    // If we're not on the active round, don't auto-advance
    if (round !== activeRound) return region;
    
    // Check if current region is complete
    if (isRegionComplete(round, region)) {
      // For Final 4 or fewer, stay on region 0
      const roundMatches = roundsData[round] || [];
      if (roundMatches.length <= 4) {
        return 0;
      }
      
      // Move to next region, wrap around to 0 if needed
      const nextRegion = (region + 1) % REGIONS;
      
      // If we've completed all regions in this round, advance to next round
      let checkRegion = nextRegion;
      let regionsChecked = 0;
      while (regionsChecked < REGIONS) {
        if (!isRegionComplete(round, checkRegion)) {
          return checkRegion;
        }
        checkRegion = (checkRegion + 1) % REGIONS;
        regionsChecked++;
      }
      
      // All regions complete, move to region 0 for next round
      return 0;
    }
    
    return region;
  };

  // Enhanced winner selection with deselection capability
  const handleWinnerSelection = (matchId, selectedQB) => {
    const match = bracket.find(m => m.id === matchId);
    if (!match) return;
    
    // If the same QB is clicked and is already the winner, deselect
    if (match.winner && match.winner.id === selectedQB.id) {
      selectWinner(matchId, null); // Deselect by passing null
      return;
    }
    
    // Otherwise, select the new winner
    selectWinner(matchId, selectedQB);
    
    // Auto-advance region if needed
    setTimeout(() => {
      const activeRound = getCurrentActiveRound();
      const nextRegion = getNextRegion(activeRound, currentRegion);
      if (nextRegion !== currentRegion) {
        setCurrentRegion(nextRegion);
      }
    }, 500); // Small delay to show the selection before advancing
  };

  // Calculate match positioning for proper bracket layout (fixed spacing)
  const getMatchPosition = (roundIndex, matchIndex, totalMatches) => {
    const baseHeight = 120; // Increased height per match to prevent overlap
    const matchHeight = 100; // Actual match card height
    
    // For first round, position matches with adequate spacing
    if (roundIndex === 0) {
      return {
        top: matchIndex * baseHeight + 40, // Increased base spacing
      };
    }
    
    // For subsequent rounds, center matches between their parent matches
    const previousRoundMatches = roundsData[roundIndex - 1]?.length || 1;
    const spacingMultiplier = Math.pow(2, roundIndex);
    const baseSpacing = baseHeight * spacingMultiplier;
    
    // Calculate center position relative to parent matches
    const parentIndex1 = matchIndex * 2;
    const parentIndex2 = matchIndex * 2 + 1;
    
    if (parentIndex1 < previousRoundMatches) {
      const parent1Pos = getMatchPosition(roundIndex - 1, parentIndex1, previousRoundMatches);
      const parent2Pos = parentIndex2 < previousRoundMatches 
        ? getMatchPosition(roundIndex - 1, parentIndex2, previousRoundMatches)
        : parent1Pos;
      
      return {
        top: (parent1Pos.top + parent2Pos.top) / 2 + (matchHeight / 4),
      };
    }
    
    return {
      top: matchIndex * baseSpacing + 40, // Increased base spacing
    };
  };

  // Render bracket connecting lines
  const renderBracketLines = () => {
    const lines = [];
    
    Object.keys(roundsData)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((roundKey) => {
        const round = Number(roundKey);
        const matches = roundsData[round];
        
        if (round < totalRounds - 1) {
          // Draw connections from this round to the next
          for (let i = 0; i < matches.length; i += 2) {
            const match1Pos = getMatchPosition(round, i, matches.length);
            const match2Pos = i + 1 < matches.length 
              ? getMatchPosition(round, i + 1, matches.length) 
              : match1Pos;
            
            const nextRoundMatchIndex = Math.floor(i / 2);
            const nextRoundMatches = roundsData[round + 1]?.length || 0;
            
            if (nextRoundMatchIndex < nextRoundMatches) {
              const nextMatchPos = getMatchPosition(round + 1, nextRoundMatchIndex, nextRoundMatches);
              
              // Horizontal lines from matches to center point
              const centerX = (round * 280) + 240 + 40; // Position between rounds
              const centerY = (match1Pos.top + match2Pos.top) / 2 + 40; // Center between matches
              
              // Line from first match to center
              lines.push(
                <div
                  key={`h1-${round}-${i}`}
                  className="absolute bg-white/30 h-0.5"
                  style={{
                    left: `${(round * 280) + 240}px`,
                    top: `${match1Pos.top + 40}px`,
                    width: '40px'
                  }}
                />
              );
              
              // Line from second match to center (if exists)
              if (i + 1 < matches.length) {
                lines.push(
                  <div
                    key={`h2-${round}-${i}`}
                    className="absolute bg-white/30 h-0.5"
                    style={{
                      left: `${(round * 280) + 240}px`,
                      top: `${match2Pos.top + 40}px`,
                      width: '40px'
                    }}
                  />
                );
              }
              
              // Vertical line connecting the two horizontal lines
              if (i + 1 < matches.length && Math.abs(match2Pos.top - match1Pos.top) > 5) {
                lines.push(
                  <div
                    key={`v-${round}-${i}`}
                    className="absolute bg-white/30 w-0.5"
                    style={{
                      left: `${centerX}px`,
                      top: `${Math.min(match1Pos.top, match2Pos.top) + 40}px`,
                      height: `${Math.abs(match2Pos.top - match1Pos.top)}px`
                    }}
                  />
                );
              }
              
              // Line from center to next round match
              lines.push(
                <div
                  key={`next-${round}-${i}`}
                  className="absolute bg-white/30 h-0.5"
                  style={{
                    left: `${centerX}px`,
                    top: `${nextMatchPos.top + 40}px`,
                    width: '40px'
                  }}
                />
              );
            }
          }
        }
      });
    
    return lines;
  };

  // Render a single match card with deselection capability
  const renderMatch = (match, roundIndex, matchIndex, totalMatches) => {
    const position = getMatchPosition(roundIndex, matchIndex, totalMatches);
    
    return (
      <div
        key={match.id}
        className="absolute w-60 bg-neutral-800 rounded-lg border border-white/10 shadow-lg hover:shadow-xl transition-shadow"
        style={{ 
          top: `${position.top}px`,
          left: `${roundIndex * 280}px`
        }}
      >
        <div className="p-3 space-y-2">
          {/* QB 1 */}
          <button
            onClick={() => handleWinnerSelection(match.id, match.qb1)}
            disabled={match.qb1.id === 'bye'}
            className={`w-full p-2.5 rounded-lg border-2 transition-all text-sm relative ${
              match.winner?.id === match.qb1.id
                ? 'border-green-500 bg-green-500/20 text-green-300 hover:border-red-400 hover:bg-red-400/10'
                : match.qb1.id === 'bye'
                ? 'border-gray-500 bg-gray-500/20 cursor-not-allowed'
                : 'border-white/20 hover:border-blue-400 hover:bg-blue-400/10 cursor-pointer'
            }`}
            title={match.winner?.id === match.qb1.id ? 'Click to deselect' : ''}
          >
            <div className="font-semibold truncate">{match.qb1.name}</div>
            <div className="text-xs text-white/60">{match.qb1.team}</div>
            {match.winner?.id === match.qb1.id && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-lg">
                ✓
              </div>
            )}
          </button>

          <div className="text-center text-white/40 text-xs font-bold py-0.5">VS</div>

          {/* QB 2 */}
          <button
            onClick={() => handleWinnerSelection(match.id, match.qb2)}
            disabled={match.qb2.id === 'bye'}
            className={`w-full p-2.5 rounded-lg border-2 transition-all text-sm relative ${
              match.winner?.id === match.qb2.id
                ? 'border-green-500 bg-green-500/20 text-green-300 hover:border-red-400 hover:bg-red-400/10'
                : match.qb2.id === 'bye'
                ? 'border-gray-500 bg-gray-500/20 cursor-not-allowed'
                : 'border-white/20 hover:border-blue-400 hover:bg-blue-400/10 cursor-pointer'
            }`}
            title={match.winner?.id === match.qb2.id ? 'Click to deselect' : ''}
          >
            <div className="font-semibold truncate">{match.qb2.name}</div>
            <div className="text-xs text-white/60">{match.qb2.team}</div>
            {match.winner?.id === match.qb2.id && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-lg">
                ✓
              </div>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render round headers
  const renderRoundHeaders = () => {
    return Object.keys(roundsData)
      .sort((a, b) => Number(a) - Number(b))
      .map((roundKey, roundIndex) => {
        const round = Number(roundKey);
        const matches = roundsData[round];
        
        return (
          <div
            key={`header-${round}`}
            className="absolute text-center"
            style={{
              left: `${roundIndex * 280}px`,
              top: '-60px',
              width: '240px'
            }}
          >
            <h3 className="text-sm font-bold text-white bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg py-2 px-3 border border-white/10 shadow-lg">
              {roundNames[round] || `Round ${round + 1}`}
            </h3>
            <div className="text-xs text-white/50 mt-1">
              {matches.filter(m => m.winner).length} / {matches.length} complete
            </div>
          </div>
        );
      });
  };

  // Calculate the full bracket structure for visualization
  const getFullBracketStructure = () => {
    const firstRoundMatches = roundsData[0]?.length || 0;
    if (firstRoundMatches === 0) return [];

    // Calculate how many rounds the tournament should have
    const totalRounds = Math.ceil(Math.log2(firstRoundMatches)) + 1;
    const structure = [];

    for (let round = 0; round < totalRounds; round++) {
      const matchesInRound = Math.max(1, firstRoundMatches / Math.pow(2, round));
      structure.push({
        round,
        expectedMatches: matchesInRound,
        actualMatches: roundsData[round] || []
      });
    }

    return structure;
  };

  // Render the full bracket structure
  const renderFullBracket = () => {
    const bracketStructure = getFullBracketStructure();
    
    return (
      <div className="overflow-x-auto overflow-y-hidden pb-8">
        <div 
          className="relative mx-auto"
          style={{ 
            width: `${Math.max(800, bracketStructure.length * 280 + 100)}px`,
            height: `${Math.max(400, (roundsData[0]?.length || 0) * 100 + 140)}px`,
            paddingTop: '80px'
          }}
        >
          {/* Round headers */}
          {bracketStructure.map((structure, roundIndex) => (
            <div
              key={`header-${structure.round}`}
              className="absolute text-center"
              style={{
                left: `${roundIndex * 280}px`,
                top: '-60px',
                width: '240px'
              }}
            >
              <h3 className="text-sm font-bold text-white bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg py-2 px-3 border border-white/10 shadow-lg">
                {roundNames[structure.round] || `Round ${structure.round + 1}`}
              </h3>
              <div className="text-xs text-white/50 mt-1">
                {structure.actualMatches.filter(m => m.winner).length} / {structure.actualMatches.length || structure.expectedMatches} {structure.actualMatches.length ? 'complete' : 'pending'}
              </div>
            </div>
          ))}

          {/* Bracket lines */}
          {renderBracketLines()}

          {/* Actual matches */}
          {Object.keys(roundsData)
            .sort((a, b) => Number(a) - Number(b))
            .map((roundKey) => {
              const round = Number(roundKey);
              const matches = roundsData[round];
              
              return matches.map((match, matchIndex) =>
                renderMatch(match, round, matchIndex, matches.length)
              );
            })}

          {/* Placeholder matches for future rounds */}
          {bracketStructure.map((structure, roundIndex) => {
            if (structure.actualMatches.length === 0 && structure.round > 0) {
              // Create placeholder matches for this round
              const placeholders = [];
              for (let i = 0; i < structure.expectedMatches; i++) {
                const position = getMatchPosition(structure.round, i, structure.expectedMatches);
                placeholders.push(
                  <div
                    key={`placeholder-${structure.round}-${i}`}
                    className="absolute w-60 bg-neutral-800/30 rounded-lg border border-white/5 shadow-lg"
                    style={{ 
                      top: `${position.top}px`,
                      left: `${roundIndex * 280}px`
                    }}
                  >
                    <div className="p-3 space-y-2">
                      <div className="w-full p-2.5 rounded-lg border-2 border-white/10 bg-neutral-700/20 text-sm">
                        <div className="font-semibold text-white/40">TBD</div>
                        <div className="text-xs text-white/30">Awaiting winner</div>
                      </div>
                      <div className="text-center text-white/30 text-xs font-bold py-0.5">VS</div>
                      <div className="w-full p-2.5 rounded-lg border-2 border-white/10 bg-neutral-700/20 text-sm">
                        <div className="font-semibold text-white/40">TBD</div>
                        <div className="text-xs text-white/30">Awaiting winner</div>
                      </div>
                    </div>
                  </div>
                );
              }
              return placeholders;
            }
            return null;
          })}
        </div>
      </div>
    );
  };

  // Get all rounds that belong to a specific region to show bracket progression
  const getRegionBracketStructure = (region) => {
    const structure = [];
    const maxRounds = Math.max(...Object.keys(roundsData).map(Number)) + 1;
    
    // Start with first round for this region
    const firstRoundMatches = getRegionMatches(0, region);
    if (firstRoundMatches.length > 0) {
      structure.push({
        round: 0,
        matches: firstRoundMatches,
        isFinal: false
      });
    }
    
    // Calculate subsequent rounds for this region
    let expectedMatchesInNextRound = Math.ceil(firstRoundMatches.length / 2);
    for (let round = 1; round <= maxRounds && expectedMatchesInNextRound > 0; round++) {
      const actualMatches = getRegionMatches(round, region);
      
      // Check if this round exists in the actual tournament data
      if (roundsData[round] && roundsData[round].length <= 4) {
        // Final 4 or fewer - don't show in region view, let it go to full bracket
        break;
      }
      
      structure.push({
        round,
        matches: actualMatches,
        expectedMatches: expectedMatchesInNextRound,
        isFinal: false
      });
      
      // Calculate next round expectations
      expectedMatchesInNextRound = Math.ceil(expectedMatchesInNextRound / 2);
      
      // Stop if we have no actual matches and it's beyond the immediate next round
      if (actualMatches.length === 0 && round > 1) {
        break;
      }
    }
    
    return structure;
  };

  // Render a single match in region bracket format
  const renderRegionMatch = (match, roundIndex, matchIndex, isPlaceholder = false) => {
    const baseHeight = 160; // Slightly reduced from 180 for better fit
    const roundWidth = 260; // Reduced from 280 for better fit
    
    const position = {
      top: matchIndex * baseHeight + 60, 
      left: roundIndex * roundWidth + 10 // Reduced padding
    };
    
    if (isPlaceholder) {
      return (
        <div
          key={`placeholder-${roundIndex}-${matchIndex}`}
          className="absolute w-60 bg-neutral-800/30 rounded-lg border border-white/5 shadow-lg"
          style={{ 
            top: `${position.top}px`,
            left: `${position.left}px`
          }}
        >
          <div className="p-3 space-y-2">
            <div className="w-full p-3 rounded-lg border-2 border-white/10 bg-neutral-700/20 text-sm">
              <div className="font-semibold text-white/40">TBD</div>
              <div className="text-xs text-white/30">Awaiting winner</div>
            </div>
            <div className="text-center text-white/30 text-xs font-bold py-0.5">VS</div>
            <div className="w-full p-3 rounded-lg border-2 border-white/10 bg-neutral-700/20 text-sm">
              <div className="font-semibold text-white/40">TBD</div>
              <div className="text-xs text-white/30">Awaiting winner</div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div
        key={match.id}
        className="absolute w-60 bg-neutral-800 rounded-lg border border-white/10 shadow-lg hover:shadow-xl transition-shadow"
        style={{ 
          top: `${position.top}px`,
          left: `${position.left}px`
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
            title={match.winner?.id === match.qb1.id ? 'Click to deselect' : ''}
          >
            <div className="font-semibold truncate">{match.qb1.name}</div>
            <div className="text-xs text-white/60">{match.qb1.team}</div>
            {match.winner?.id === match.qb1.id && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-lg">
                ✓
              </div>
            )}
          </button>

          <div className="text-center text-white/40 text-xs font-bold py-0.5">VS</div>

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
            title={match.winner?.id === match.qb2.id ? 'Click to deselect' : ''}
          >
            <div className="font-semibold truncate">{match.qb2.name}</div>
            <div className="text-xs text-white/60">{match.qb2.team}</div>
            {match.winner?.id === match.qb2.id && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-lg">
                ✓
              </div>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render connecting lines between rounds in region bracket
  const renderRegionBracketLines = (structure) => {
    const lines = [];
    const baseHeight = 160; // Match the new baseHeight
    const roundWidth = 260; // Match the new roundWidth
    
    for (let roundIndex = 0; roundIndex < structure.length - 1; roundIndex++) {
      const currentRound = structure[roundIndex];
      const nextRound = structure[roundIndex + 1];
      
      if (!currentRound.matches || currentRound.matches.length === 0) continue;
      
      // Connect every pair of matches in current round to next round
      for (let i = 0; i < currentRound.matches.length; i += 2) {
        const match1 = currentRound.matches[i];
        const match2 = currentRound.matches[i + 1];
        
        if (!match1) continue;
        
        const match1Y = i * baseHeight + 60 + 70; // Center of first match (60 top + 70 for center)
        const match2Y = match2 ? (i + 1) * baseHeight + 60 + 70 : match1Y; // Center of second match
        
        const nextMatchIndex = Math.floor(i / 2);
        const nextMatchY = nextMatchIndex * baseHeight + 60 + 70; // Center of next round match
        
        const currentRoundX = roundIndex * roundWidth + 10 + 240; // Right edge of current round matches (10 padding + 240 width)
        const nextRoundX = (roundIndex + 1) * roundWidth + 10; // Left edge of next round matches
        const centerX = currentRoundX + 15; // Midpoint for vertical line
        
        // Horizontal line from first match
        lines.push(
          <div
            key={`h1-${roundIndex}-${i}`}
            className="absolute bg-white/30 h-0.5"
            style={{
              left: `${currentRoundX}px`,
              top: `${match1Y}px`,
              width: '15px'
            }}
          />
        );
        
        // Horizontal line from second match (if exists)
        if (match2) {
          lines.push(
            <div
              key={`h2-${roundIndex}-${i}`}
              className="absolute bg-white/30 h-0.5"
              style={{
                left: `${currentRoundX}px`,
                top: `${match2Y}px`,
                width: '15px'
              }}
            />
          );
        }
        
        // Vertical line connecting the horizontal lines
        if (match2 && Math.abs(match2Y - match1Y) > 5) {
          lines.push(
            <div
              key={`v-${roundIndex}-${i}`}
              className="absolute bg-white/30 w-0.5"
              style={{
                left: `${centerX}px`,
                top: `${Math.min(match1Y, match2Y)}px`,
                height: `${Math.abs(match2Y - match1Y)}px`
              }}
            />
          );
        }
        
        // Horizontal line to next round match
        if (nextRound.matches.length > nextMatchIndex) {
          lines.push(
            <div
              key={`next-${roundIndex}-${i}`}
              className="absolute bg-white/30 h-0.5"
              style={{
                left: `${centerX}px`,
                top: `${nextMatchY}px`,
                width: '15px'
              }}
            />
          );
        }
      }
    }
    
    return lines;
  };

  // Render region-based view with bracket format
  const renderRegionView = () => {
    const activeRound = getCurrentActiveRound();
    const totalMatches = roundsData[activeRound]?.length || 0;
    
    // Check if this is Final 4 or fewer - use traditional bracket view
    if (totalMatches <= 4) {
      return renderFullBracket();
    }
    
    const regionStructure = getRegionBracketStructure(currentRegion);
    
    if (regionStructure.length === 0) {
      return (
        <div className="text-center text-white/60 py-8">
          No matches available for this region
        </div>
      );
    }
    
    // Calculate container dimensions
    const maxMatches = Math.max(...regionStructure.map(r => r.matches?.length || r.expectedMatches || 0));
    const containerHeight = Math.max(400, maxMatches * 160 + 120); // Account for new spacing
    const containerWidth = Math.max(700, regionStructure.length * 260 + 60); // Account for new width
    
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
            {getRegionMatches(activeRound, currentRegion).filter(m => m.winner).length} / {getRegionMatches(activeRound, currentRegion).length} matches complete
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

        {/* Region Bracket */}
        <div className="overflow-hidden pb-4"> {/* Remove overflow-x-auto to prevent horizontal scrolling */}
          <div 
            className="relative mx-auto"
            style={{ 
              width: `${containerWidth}px`,
              height: `${containerHeight}px`,
              maxWidth: '100vw', // Ensure it doesn't exceed viewport width
              paddingTop: '60px'
            }}
          >
            {/* Round headers */}
            {regionStructure.map((roundStructure, roundIndex) => (
              <div
                key={`header-${roundStructure.round}`}
                className="absolute text-center"
                style={{
                  left: `${roundIndex * 260 + 10}px`,
                  top: '-40px',
                  width: '240px'
                }}
              >
                <h4 className="text-sm font-bold text-white bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg py-1.5 px-3 border border-white/10">
                  {roundNames[roundStructure.round] || `Round ${roundStructure.round + 1}`}
                </h4>
                <div className="text-xs text-white/50 mt-1">
                  {roundStructure.matches.filter(m => m.winner).length} / {roundStructure.matches.length || roundStructure.expectedMatches || 0} complete
                </div>
              </div>
            ))}

            {/* Bracket connecting lines */}
            {renderRegionBracketLines(regionStructure)}

            {/* Actual matches */}
            {regionStructure.map((roundStructure, roundIndex) => 
              roundStructure.matches.map((match, matchIndex) =>
                renderRegionMatch(match, roundIndex, matchIndex)
              )
            )}

            {/* Placeholder matches for future rounds */}
            {regionStructure.map((roundStructure, roundIndex) => {
              if (roundStructure.matches.length === 0 && roundStructure.expectedMatches > 0) {
                const placeholders = [];
                for (let i = 0; i < roundStructure.expectedMatches; i++) {
                  placeholders.push(renderRegionMatch(null, roundIndex, i, true));
                }
                return placeholders;
              }
              return null;
            })}
          </div>
        </div>

        {/* Auto-advance indicator */}
        {isRegionComplete(activeRound, currentRegion) && (
          <div className="text-center mt-6 p-4 bg-green-600/20 border border-green-500/30 rounded-lg">
            <div className="text-green-400 font-medium">
              ✓ Region {currentRegion + 1} Complete!
            </div>
            <div className="text-green-300/80 text-sm mt-1">
              Moving to next region...
            </div>
          </div>
        )}
      </div>
    );
  };

  // View toggle controls with new region view
  const renderViewControls = () => {
    // Always show controls when there are matches to display
    if (Object.keys(roundsData).length === 0) return null;

    return (
      <div className="flex justify-center mb-6 gap-2">
        <button
          onClick={() => { setShowRegionView(true); setShowCompactView(false); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showRegionView
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-700 text-white/70 hover:bg-neutral-600'
          }`}
        >
          Region View
        </button>
        <button
          onClick={() => { setShowRegionView(false); setShowCompactView(false); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !showRegionView && !showCompactView
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-700 text-white/70 hover:bg-neutral-600'
          }`}
        >
          Bracket View
        </button>
        <button
          onClick={() => { setShowRegionView(false); setShowCompactView(true); }}
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

  // Render compact view (updated to use new selection handler)
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
            {matches.filter(m => m.winner).length} / {matches.length} matches complete
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
                  title={match.winner?.id === match.qb1.id ? 'Click to deselect' : ''}
                >
                  <div className="font-semibold">{match.qb1.name}</div>
                  <div className="text-xs text-white/60">{match.qb1.team}</div>
                  {match.winner?.id === match.qb1.id && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-400 text-lg">
                      ✓
                    </div>
                  )}
                </button>

                <div className="text-center text-white/40 text-xs font-bold py-1">VS</div>

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
                  title={match.winner?.id === match.qb2.id ? 'Click to deselect' : ''}
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

  // Effect to monitor container size and auto-advance regions
  useEffect(() => {
    const updateContainerWidth = () => {
      const container = document.querySelector('.tournament-container');
      if (container) {
        setContainerWidth(container.clientWidth);
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  // Auto-advance region when current region completes
  useEffect(() => {
    if (showRegionView) {
      const activeRound = getCurrentActiveRound();
      const nextRegion = getNextRegion(activeRound, currentRegion);
      if (nextRegion !== currentRegion) {
        // Small delay to show completion before advancing
        const timer = setTimeout(() => {
          setCurrentRegion(nextRegion);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [bracket, currentRegion, showRegionView]);

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
      
      {showRegionView ? (
        renderRegionView()
      ) : showCompactView ? (
        renderCompactView()
      ) : (
        renderFullBracket()
      )}
    </div>
  );
};

export default TournamentBracket;