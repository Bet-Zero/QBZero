import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { TOURNAMENT_BACKUP_QBS } from '@/utils/backupQBs/tournamentQBs';
import TournamentBracket from '@/components/shared/TournamentBracket';

const BackupQBTournament = () => {
  const [bracket, setBracket] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundNames] = useState(['First Round', 'Quarterfinals', 'Semifinals', 'Final', 'Champion']);
  const [isGenerating, setIsGenerating] = useState(false);

  // Use the hardcoded tournament backup QBs
  const backupQBs = TOURNAMENT_BACKUP_QBS;

  // Generate initial tournament bracket with full structure
  const generateTournament = () => {
    setIsGenerating(true);
    
    // Shuffle the backup QBs randomly
    const shuffledQBs = [...backupQBs].sort(() => Math.random() - 0.5);
    
    // Use all 32 QBs for the tournament bracket
    const tournamentQBs = [...shuffledQBs];
    
    // Pad with byes if needed to make a power of 2 (32 is already a power of 2)
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(tournamentQBs.length)));
    while (tournamentQBs.length < nextPowerOf2) {
      tournamentQBs.push({ id: 'bye', name: 'BYE', team: '' });
    }

    // Create full bracket structure for all rounds
    const fullBracket = [];
    let currentRoundQBs = [...tournamentQBs];
    let round = 0;
    
    // Generate all rounds upfront
    while (currentRoundQBs.length > 1) {
      const roundMatches = [];
      
      // Create matches for current round
      for (let i = 0; i < currentRoundQBs.length; i += 2) {
        roundMatches.push({
          id: `match-${round}-${i/2}`,
          qb1: currentRoundQBs[i],
          qb2: currentRoundQBs[i + 1],
          winner: null,
          round: round
        });
      }
      
      fullBracket.push(...roundMatches);
      
      // Prepare next round with placeholder QBs
      const nextRoundQBs = [];
      for (let i = 0; i < roundMatches.length; i++) {
        nextRoundQBs.push({
          id: `placeholder-${round + 1}-${i}`,
          name: 'TBD',
          team: ''
        });
      }
      
      currentRoundQBs = nextRoundQBs;
      round++;
    }

    setBracket(fullBracket);
    setCurrentRound(0);
    
    setTimeout(() => setIsGenerating(false), 500);
  };

  // Handle match winner selection with real-time bracket updates
  const selectWinner = (matchId, winner) => {
    const updatedBracket = [...bracket];
    const match = updatedBracket.find(m => m.id === matchId);
    if (!match) return;
    
    // If winner is null, deselect current winner
    if (winner === null) {
      match.winner = null;
      
      // Also clear any dependent matches in next rounds
      const clearDependentMatches = (currentMatch) => {
        const matchRound = currentMatch.round;
        const matchIndexInRound = parseInt(currentMatch.id.split('-')[2]);
        const nextRoundMatchIndex = Math.floor(matchIndexInRound / 2);
        const nextRoundMatch = updatedBracket.find(m => 
          m.round === matchRound + 1 && 
          m.id === `match-${matchRound + 1}-${nextRoundMatchIndex}`
        );
        
        if (nextRoundMatch) {
          // Determine which QB slot to clear (qb1 or qb2)
          const isFirstSlot = matchIndexInRound % 2 === 0;
          const placeholderQB = {
            id: `placeholder-${matchRound + 1}-${nextRoundMatchIndex}`,
            name: 'TBD',
            team: ''
          };
          
          if (isFirstSlot) {
            nextRoundMatch.qb1 = placeholderQB;
          } else {
            nextRoundMatch.qb2 = placeholderQB;
          }
          
          // If this was the winner, clear it and recurse
          if (nextRoundMatch.winner && 
              (nextRoundMatch.winner.id === currentMatch.winner?.id)) {
            nextRoundMatch.winner = null;
            clearDependentMatches(nextRoundMatch);
          }
        }
      };
      
      if (match.winner) {
        clearDependentMatches(match);
      }
      
      setBracket(updatedBracket);
      return;
    }
    
    match.winner = winner;
    
    // Update next round match in real-time
    const matchRound = match.round;
    const matchIndexInRound = parseInt(match.id.split('-')[2]);
    const nextRoundMatchIndex = Math.floor(matchIndexInRound / 2);
    const nextRoundMatch = updatedBracket.find(m => 
      m.round === matchRound + 1 && 
      m.id === `match-${matchRound + 1}-${nextRoundMatchIndex}`
    );
    
    if (nextRoundMatch) {
      // Determine which QB slot to update (qb1 or qb2)
      const isFirstSlot = matchIndexInRound % 2 === 0;
      
      if (isFirstSlot) {
        nextRoundMatch.qb1 = winner;
      } else {
        nextRoundMatch.qb2 = winner;
      }
    }
    
    setBracket(updatedBracket);

    // Check if current round is complete to advance
    const currentRoundMatches = updatedBracket.filter(m => m.round === currentRound);
    const completedMatches = currentRoundMatches.filter(m => m.winner);
    
    if (completedMatches.length === currentRoundMatches.length && currentRoundMatches.length > 1) {
      setCurrentRound(currentRound + 1);
    }
  };

  // Get current round matches
  const getCurrentRoundMatches = () => {
    return bracket.filter(match => match.round === currentRound);
  };

  // Get tournament champion
  const getChampion = () => {
    const finalMatch = bracket.find(m => m.round === currentRound && getCurrentRoundMatches().length === 1);
    return finalMatch?.winner;
  };

  useEffect(() => {
    if (backupQBs.length > 0 && bracket.length === 0) {
      generateTournament();
    }
  }, []);

  if (false) { // Remove loading dependency since we use hardcoded data
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <div className="text-white/60 text-lg">Loading backup QBs...</div>
      </div>
    );
  }

  const currentMatches = getCurrentRoundMatches();
  const champion = getChampion();

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/backup-qbs" 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Backup QB Tournament
            </h1>
            <p className="text-white/70 mt-2">
              Battle of the backup quarterbacks - vote your way to the ultimate backup QB!
            </p>
          </div>
          <button
            onClick={generateTournament}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
            Randomize
          </button>
        </div>

        {/* Tournament Status */}
        {bracket.length > 0 && (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-4 px-6 py-3 bg-neutral-800 rounded-lg border border-white/10">
              <span className="text-lg font-semibold">
                {champion ? '🏆 Tournament Complete!' : roundNames[currentRound] || 'Tournament'}
              </span>
              {!champion && (
                <span className="text-white/60">
                  {currentMatches.filter(m => m.winner).length} / {currentMatches.length} matches complete
                </span>
              )}
            </div>
          </div>
        )}

        {/* Champion Display */}
        {champion && (
          <div className="mb-8 text-center">
            <div className="inline-block p-8 bg-gradient-to-br from-yellow-600/30 to-orange-600/30 rounded-xl border-2 border-yellow-500/50">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold mb-2">Tournament Champion</h2>
              <div className="text-2xl font-semibold text-yellow-400">{champion.name}</div>
              <div className="text-lg text-white/70">{champion.team}</div>
            </div>
          </div>
        )}

        {/* Tournament Bracket */}
        {bracket.length > 0 && (
          <div className="space-y-6">
            <TournamentBracket
              bracket={bracket}
              selectWinner={selectWinner}
              roundNames={roundNames}
            />
          </div>
        )}

        {/* Empty State */}
        {bracket.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/40 text-lg mb-4">
              No backup QBs found. Generate a tournament to get started!
            </div>
            <button
              onClick={generateTournament}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              Generate Tournament
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupQBTournament;