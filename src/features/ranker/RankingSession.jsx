import React, { useEffect, useMemo, useState } from 'react';
import PlayerCompareCard from './PlayerCompareCard';
import RankingResults from './RankingResults';
import ComparisonMatrixDrawer from './ComparisonMatrixDrawer';
import { AnchorComparison } from './AnchorComparison';
import {
  generateRankingFromComparisons,
  suggestNextPair,
  estimateRemainingComparisons,
  buildAnchorComparisons,
} from '@/utils/ranker/rankingEngine';

const RankingSession = ({ playerPool = [], setupData, onComplete }) => {
  const players = useMemo(
    () => playerPool.map((p) => p.original || p),
    [playerPool]
  );

  // Initialize state
  const [currentPair, setCurrentPair] = useState([]);
  const [results, setResults] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [anchorDone, setAnchorDone] = useState(!setupData?.anchor);
  const [comparisonTotal, setComparisonTotal] = useState(0);

  // Compute initial results only once when setupData changes
  const initialResults = useMemo(() => {
    if (!setupData || !players.length) return [];

    const initial = [];
    if (setupData.firstPlace) {
      players.forEach((p) => {
        if (p.id !== setupData.firstPlace) {
          initial.push({ winner: setupData.firstPlace, loser: p.id });
        }
      });
    }
    if (setupData.lastPlace) {
      players.forEach((p) => {
        if (p.id !== setupData.lastPlace) {
          initial.push({ winner: p.id, loser: setupData.lastPlace });
        }
      });
    }
    return initial;
  }, [setupData, players]);

  // Set initial results once
  useEffect(() => {
    if (initialResults.length > 0) {
      setResults(initialResults);
    }
  }, [initialResults]);

  const groupedPlayers = useMemo(() => {
    if (!setupData || (setupData.anchor && !anchorDone)) return players;
    const { topTier = [], bottomTier = [], anchor } = setupData;
    const better = new Set();
    if (anchor) {
      results.forEach(({ winner, loser }) => {
        if (loser === anchor) better.add(winner);
      });
    }
    return players.map((p) => {
      let group;
      if (p.id === anchor) group = 'anchor';
      else if (topTier.includes(p.id)) group = 'top';
      else if (bottomTier.includes(p.id)) group = 'bottom';
      else if (anchor) group = better.has(p.id) ? 'upper' : 'lower';
      else group = 'upper';
      return { ...p, group };
    });
  }, [players, setupData, results, anchorDone]);

  const remaining = useMemo(
    () => estimateRemainingComparisons(results, groupedPlayers),
    [results, groupedPlayers]
  );

  // Update comparison total once when starting comparisons
  useEffect(() => {
    if (!comparisonTotal && setupData && (!setupData.anchor || anchorDone)) {
      setComparisonTotal(remaining);
    }
  }, [comparisonTotal, setupData, anchorDone, remaining]);

  const comparisonsDone = comparisonTotal ? comparisonTotal - remaining : 0;
  const progressPercent = comparisonTotal
    ? (comparisonsDone / comparisonTotal) * 100
    : 0;

  // Handle next pair and completion
  useEffect(() => {
    if (!setupData) return;
    if (setupData.anchor && !anchorDone) return;
    if (groupedPlayers.length < 2) return;

    const next = suggestNextPair(results, groupedPlayers);
    if (next.length === 0 && !isFinished) {
      setIsFinished(true);
      setCurrentPair([]);

      if (onComplete) {
        const ranking = generateRankingFromComparisons(
          results,
          groupedPlayers,
          setupData
        );
        onComplete(ranking, results);
      }
    } else if (next.length > 0) {
      setCurrentPair(next);
    }
  }, [results, groupedPlayers, setupData, anchorDone, onComplete, isFinished]);

  const handleSelect = (winner, loser) => {
    setResults((prev) => [...prev, { winner: winner.id, loser: loser.id }]);
  };

  const handleSkip = () => {
    const next = suggestNextPair(results, groupedPlayers);
    setCurrentPair(next);
  };

  const handleUndo = () => {
    if (results.length === 0) return;
    const newResults = results.slice(0, -1);
    setResults(newResults);
    setIsFinished(false);
  };

  if (isFinished) {
    const ranking = generateRankingFromComparisons(
      results,
      groupedPlayers,
      setupData
    );
    return (
      <>
        <RankingResults ranking={ranking} />
        <div className="text-white/30 mt-8 text-center text-sm italic px-4">
          Ranking created on{' '}
          {new Date().toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
        <ComparisonMatrixDrawer
          players={groupedPlayers}
          comparisons={results}
        />
      </>
    );
  }

  if (setupData?.anchor && !anchorDone) {
    const anchorPlayer = players.find((p) => p.id === setupData.anchor);
    const tagged = new Set(
      [
        ...setupData.topTier,
        ...setupData.bottomTier,
        setupData.firstPlace,
        setupData.lastPlace,
      ].filter(Boolean)
    );

    const untagged = players.filter(
      (p) => p.id !== setupData.anchor && !tagged.has(p.id)
    );

    const handleAnchorComplete = (betterIds) => {
      const newResults = buildAnchorComparisons(
        setupData.anchor,
        untagged,
        betterIds
      );
      if (newResults.length) setResults((prev) => [...prev, ...newResults]);
      setAnchorDone(true);
    };

    return (
      <AnchorComparison
        anchor={anchorPlayer}
        players={untagged}
        onComplete={handleAnchorComplete}
      />
    );
  }

  if (!currentPair.length) {
    return <div className="text-white px-4 text-center">Loading...</div>;
  }

  return (
    <>
      <div className="flex flex-col items-center pt-6 sm:pt-12 px-4">
        <PlayerCompareCard
          left={currentPair[0]}
          right={currentPair[1]}
          onSelect={handleSelect}
          onSkip={handleSkip}
          onUndo={handleUndo}
        />
        <div className="w-full max-w-sm sm:max-w-xs mt-6 sm:mt-4">
          <div className="w-full bg-white/20 h-3 rounded-full">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <div className="mt-3 text-white/60 text-sm text-center">
          {comparisonsDone} / {comparisonTotal} comparisons
        </div>
      </div>
      <ComparisonMatrixDrawer players={groupedPlayers} comparisons={results} />
    </>
  );
};

export default RankingSession;
