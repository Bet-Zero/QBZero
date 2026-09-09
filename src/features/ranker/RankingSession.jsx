import React, { useEffect, useMemo, useState } from 'react';
import PlayerCompareCard from './PlayerCompareCard';
import ComparisonMatrixDrawer from './ComparisonMatrixDrawer';
import { AnchorComparison } from './AnchorComparison';
import {
  generateRankingFromComparisons,
  suggestNextPair,
  estimateRemainingComparisons,
  buildAnchorComparisons,
  pairKey,
} from '@/utils/ranker/rankingEngine';

const RankingSession = ({ playerPool = [], setupData, onComplete }) => {
  const players = useMemo(
    () => playerPool.map((p) => p.original || p),
    [playerPool]
  );

  // The session's comparison record has three sources, kept separate so that
  // progress and undo only ever act on the user's own pairwise answers:
  //   1. `initialResults`  - implied by first/last place lock-ins
  //   2. `anchorResults`   - the one-shot anchor sweep
  //   3. `history`         - the user's answers and skips, in order
  const [currentPair, setCurrentPair] = useState([]);
  const [anchorResults, setAnchorResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [anchorDone, setAnchorDone] = useState(!setupData?.anchor);

  // Comparisons implied by the first/last place lock-ins. Derived rather than
  // pushed into state, so it can never be clobbered or undone away.
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

  const userResults = useMemo(
    () =>
      history
        .filter((entry) => entry.type === 'answer')
        .map(({ winner, loser }) => ({ winner, loser })),
    [history]
  );

  const skippedPairs = useMemo(
    () =>
      new Set(
        history.filter((entry) => entry.type === 'skip').map((e) => e.key)
      ),
    [history]
  );

  const results = useMemo(
    () => [...initialResults, ...anchorResults, ...userResults],
    [initialResults, anchorResults, userResults]
  );

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
    () => estimateRemainingComparisons(results, groupedPlayers, skippedPairs),
    [results, groupedPlayers, skippedPairs]
  );

  // `remaining` is a forward simulation that assumes the first player always
  // wins, so it moves around as real answers diverge from that assumption.
  // Deriving the total from it each render keeps the numbers in range instead
  // of subtracting a moving estimate from a frozen one (which went negative).
  const answered = userResults.length;
  const estimatedTotal = answered + remaining;
  const rawPercent = estimatedTotal
    ? Math.min(100, (answered / estimatedTotal) * 100)
    : 0;

  // The estimate is noisy enough to move backwards; hold the bar at its high
  // water mark so it never appears to lose progress.
  const [shownPercent, setShownPercent] = useState(0);
  useEffect(() => {
    setShownPercent((prev) => Math.max(prev, rawPercent));
  }, [rawPercent]);

  // Handle next pair and completion
  useEffect(() => {
    if (!setupData) return;
    if (setupData.anchor && !anchorDone) return;
    if (groupedPlayers.length < 2) return;

    const next = suggestNextPair(results, groupedPlayers, skippedPairs);
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
  }, [
    results,
    groupedPlayers,
    skippedPairs,
    setupData,
    anchorDone,
    onComplete,
    isFinished,
  ]);

  const handleSelect = (winner, loser) => {
    setHistory((prev) => [
      ...prev,
      { type: 'answer', winner: winner.id, loser: loser.id },
    ]);
  };

  // Recording the skip is what actually advances the session: suggestNextPair
  // is a pure function of its inputs, so re-running it unchanged returned the
  // same pair and the button did nothing.
  const handleSkip = () => {
    if (currentPair.length < 2) return;
    setHistory((prev) => [
      ...prev,
      { type: 'skip', key: pairKey(currentPair[0].id, currentPair[1].id) },
    ]);
  };

  // Undo walks back the user's own actions only, so lock-in and anchor
  // comparisons can never be undone away. Skips are undoable too.
  const handleUndo = () => {
    if (history.length === 0) return;
    setHistory((prev) => prev.slice(0, -1));
    setIsFinished(false);
  };

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
      if (newResults.length) setAnchorResults(newResults);
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
              data-testid="progress-bar"
              style={{ width: `${shownPercent}%` }}
            />
          </div>
        </div>
        <div
          className="mt-3 text-white/60 text-sm text-center"
          data-testid="progress-label"
        >
          {answered} of ~{estimatedTotal} comparisons
        </div>
      </div>
      <ComparisonMatrixDrawer players={groupedPlayers} comparisons={results} />
    </>
  );
};

export default RankingSession;
