import React, { useEffect, useMemo, useRef, useState } from 'react';
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

/**
 * Identifies the pool and setup a saved session belongs to. Progress saved
 * against a different pool or setup is ignored rather than replayed, since its
 * answers would refer to players or groupings that no longer apply.
 */
export const sessionProgressKey = (playerPool = [], setupData = null) =>
  JSON.stringify({
    ids: playerPool.map((p) => (p.original || p).id),
    setup: setupData
      ? {
          topTier: setupData.topTier || [],
          bottomTier: setupData.bottomTier || [],
          anchor: setupData.anchor || null,
          firstPlace: setupData.firstPlace || null,
          lastPlace: setupData.lastPlace || null,
        }
      : null,
  });

const RankingSession = ({
  playerPool = [],
  setupData,
  onComplete,
  savedProgress = null,
  onProgressChange,
  onViewResults,
}) => {
  const players = useMemo(
    () => playerPool.map((p) => p.original || p),
    [playerPool]
  );

  const progressKey = useMemo(
    () => sessionProgressKey(playerPool, setupData),
    [playerPool, setupData]
  );

  // Only progress recorded against this exact pool and setup is resumed. Read
  // once, on mount: from then on this component's state is the source of
  // truth and is written back through onProgressChange.
  const [restored] = useState(() =>
    savedProgress && savedProgress.key === progressKey ? savedProgress : null
  );

  // The session's comparison record has three sources, kept separate so that
  // progress and undo only ever act on the user's own pairwise answers:
  //   1. `initialResults`  - implied by first/last place lock-ins
  //   2. `anchorResults`   - the one-shot anchor sweep
  //   3. `history`         - the user's answers and skips, in order
  const [currentPair, setCurrentPair] = useState([]);
  const [anchorResults, setAnchorResults] = useState(
    () => restored?.anchorResults || []
  );
  const [history, setHistory] = useState(() => restored?.history || []);
  const [isFinished, setIsFinished] = useState(false);
  const [anchorDone, setAnchorDone] = useState(
    () => restored?.anchorDone ?? !setupData?.anchor
  );

  // Whether the user has done anything since this component mounted. A session
  // restored already complete must not re-run onComplete by itself: that would
  // recompute the ranking over any adjustments made on the results page.
  const actedRef = useRef(false);

  // Save every answer as it is given, so a reload or a trip to another page
  // resumes the session instead of starting it over.
  useEffect(() => {
    onProgressChange?.({
      key: progressKey,
      history,
      anchorResults,
      anchorDone,
    });
  }, [onProgressChange, progressKey, history, anchorResults, anchorDone]);

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

  // A stale or shared setup can name an anchor that is not in the current pool.
  // Resolving it here means the anchor pass is skipped rather than rendering
  // AnchorComparison with an undefined anchor, which threw on `anchor.name`.
  const anchorPlayer = useMemo(() => {
    if (!setupData?.anchor) return null;
    return players.find((p) => p.id === setupData.anchor) || null;
  }, [players, setupData]);

  const anchorPending = Boolean(anchorPlayer) && !anchorDone;

  const groupedPlayers = useMemo(() => {
    if (!setupData || anchorPending) return players;
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
  }, [players, setupData, results, anchorPending]);

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
    if (anchorPending) return;
    if (groupedPlayers.length < 2) return;

    const next = suggestNextPair(results, groupedPlayers, skippedPairs);
    if (next.length === 0 && !isFinished) {
      setIsFinished(true);
      setCurrentPair([]);

      if (onComplete && actedRef.current) {
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
    anchorPending,
    onComplete,
    isFinished,
  ]);

  const handleSelect = (winner, loser) => {
    actedRef.current = true;
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
    actedRef.current = true;
    setHistory((prev) => [
      ...prev,
      { type: 'skip', key: pairKey(currentPair[0].id, currentPair[1].id) },
    ]);
  };

  // Undo walks back the user's own actions only, so lock-in and anchor
  // comparisons can never be undone away. Skips are undoable too.
  const handleUndo = () => {
    if (history.length === 0) return;
    actedRef.current = true;
    setHistory((prev) => prev.slice(0, -1));
    setIsFinished(false);
  };

  if (anchorPending) {
    // Defaults guard against setup data saved before a field existed; spreading
    // an undefined tier here used to throw.
    const tagged = new Set(
      [
        ...(setupData.topTier || []),
        ...(setupData.bottomTier || []),
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
      actedRef.current = true;
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

  // Reached when a saved session is reopened after its last answer: offer the
  // results, or a way back into the last matchup.
  if (isFinished && !currentPair.length) {
    const viewResults = () => {
      if (onViewResults) {
        onViewResults();
      } else if (onComplete) {
        onComplete(
          generateRankingFromComparisons(results, groupedPlayers, setupData),
          results
        );
      }
    };

    return (
      <div className="flex flex-col items-center pt-12 px-4 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">All comparisons done</h2>
        <p className="text-white/60 mb-6">{answered} comparisons answered.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={viewResults}
            className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 font-semibold transition-colors"
          >
            See results
          </button>
          {history.length > 0 && (
            <button
              onClick={handleUndo}
              className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-semibold transition-colors"
            >
              Undo last pick
            </button>
          )}
        </div>
      </div>
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
