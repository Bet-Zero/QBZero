// 📁 src/utils/ranker/rankingEngine.js

// ========== 🧠 UTILITY FUNCTIONS ==========

// Determine if a direct comparison already exists
const alreadyCompared = (a, b, comparisons) =>
  comparisons.some(
    (c) =>
      (c.winner === a && c.loser === b) || (c.winner === b && c.loser === a)
  );

// Canonical, order-independent key for a pair of player ids
export const pairKey = (a, b) => [a, b].sort().join('|');

// Build graph of wins/losses
const buildGraph = (comparisons) => {
  const graph = {};
  comparisons.forEach(({ winner, loser }) => {
    if (!graph[winner]) graph[winner] = new Set();
    graph[winner].add(loser);
  });
  return graph;
};

// Restrict comparisons to players actually in the pool. Stale localStorage, a
// shared link, or an edited pool can all carry ids that no longer exist; left
// in, they pull phantom nodes into the topological sort and silently reorder
// (or add undefined entries to) the result.
const scopeToPool = (comparisons, idSet) =>
  comparisons.filter((c) => idSet.has(c.winner) && idSet.has(c.loser));

/**
 * Find contradictions in the recorded comparisons - sets of players where the
 * "beats" relation loops back on itself (a > b > c > a). A cycle makes any
 * ordering of those players arbitrary, so callers should surface it rather than
 * present the result as a considered ranking.
 *
 * Returns an array of cycles, each an array of player ids. Comparisons
 * involving players outside the pool are ignored.
 */
export const detectComparisonCycles = (comparisons, players) => {
  const idSet = new Set(players.map((p) => p.id));
  const graph = buildGraph(scopeToPool(comparisons, idSet));

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = {};
  idSet.forEach((id) => {
    color[id] = WHITE;
  });

  const cycles = [];
  const seen = new Set();
  const path = [];

  const visit = (node) => {
    color[node] = GRAY;
    path.push(node);

    (graph[node] || new Set()).forEach((next) => {
      if (!idSet.has(next)) return;
      if (color[next] === GRAY) {
        // Back edge: everything from `next` onwards on the current path forms
        // a cycle.
        const cycle = path.slice(path.indexOf(next));
        const key = [...cycle].sort().join('|');
        if (!seen.has(key)) {
          seen.add(key);
          cycles.push(cycle);
        }
      } else if (color[next] === WHITE) {
        visit(next);
      }
    });

    path.pop();
    color[node] = BLACK;
  };

  idSet.forEach((id) => {
    if (color[id] === WHITE) visit(id);
  });

  return cycles;
};

// Suggest next strategic pair while respecting group isolation
// ✅ SMART MATCHUP GENERATOR
export function suggestNextPair(rawComparisons, players, skippedPairs) {
  if (players.length < 2) return [];

  const comparisons = scopeToPool(
    rawComparisons,
    new Set(players.map((p) => p.id))
  );
  const isSkipped = (a, b) => !!skippedPairs?.has(pairKey(a, b));

  // Helper to suggest a pair within a single group
  const suggestInGroup = (groupPlayers) => {
    if (groupPlayers.length < 2) return [];
    const idSet = new Set(groupPlayers.map((p) => p.id));
    const groupComps = comparisons.filter(
      (c) => idSet.has(c.winner) && idSet.has(c.loser)
    );

    const seen = new Set();
    groupComps.forEach(({ winner, loser }) => {
      seen.add(`${winner}->${loser}`);
      seen.add(`${loser}->${winner}`);
    });
    groupPlayers.forEach((a) => {
      groupPlayers.forEach((b) => {
        if (a.id !== b.id && isSkipped(a.id, b.id)) {
          seen.add(`${a.id}->${b.id}`);
          seen.add(`${b.id}->${a.id}`);
        }
      });
    });

    const usageCount = {};
    groupPlayers.forEach((p) => (usageCount[p.id] = 0));
    groupComps.forEach(({ winner, loser }) => {
      usageCount[winner]++;
      usageCount[loser]++;
    });

    const graph = {};
    groupPlayers.forEach((p) => (graph[p.id] = new Set()));
    groupComps.forEach(({ winner, loser }) => {
      graph[winner].add(loser);
    });

    const closure = {};
    for (const a in graph) {
      closure[a] = new Set();
      const stack = [...graph[a]];
      while (stack.length > 0) {
        const next = stack.pop();
        if (!closure[a].has(next)) {
          closure[a].add(next);
          graph[next]?.forEach((n) => stack.push(n));
        }
      }
    }

    // Phase 1: New vs New inside the group
    const unused = groupPlayers.filter((p) => usageCount[p.id] === 0);
    if (unused.length >= 2) {
      for (let i = 0; i < unused.length; i++) {
        for (let j = i + 1; j < unused.length; j++) {
          const key = `${unused[i].id}->${unused[j].id}`;
          if (!seen.has(key)) return [unused[i], unused[j]];
        }
      }
    }

    // Phase 2: Usage-balanced unresolved matchups
    const unresolved = [];
    for (let i = 0; i < groupPlayers.length; i++) {
      for (let j = i + 1; j < groupPlayers.length; j++) {
        const a = groupPlayers[i];
        const b = groupPlayers[j];
        const key = `${a.id}->${b.id}`;
        const aBeatsB = closure[a.id]?.has(b.id);
        const bBeatsA = closure[b.id]?.has(a.id);

        if (!seen.has(key) && !aBeatsB && !bBeatsA) {
          const usageGap = Math.abs(usageCount[a.id] - usageCount[b.id]);
          const totalUsage = usageCount[a.id] + usageCount[b.id];
          unresolved.push({
            pair: [a, b],
            score: totalUsage + usageGap * 2,
          });
        }
      }
    }

    if (unresolved.length > 0) {
      unresolved.sort((a, b) => a.score - b.score);
      return unresolved[0].pair;
    }

    return [];
  };

  // Group players by tag (default group if undefined)
  const groups = {};
  players.forEach((p) => {
    const g = p.group || 'default';
    if (!groups[g]) groups[g] = [];
    groups[g].push(p);
  });

  // Try to resolve matchups within each group first
  for (const g of Object.keys(groups)) {
    const pair = suggestInGroup(groups[g]);
    if (pair.length) return pair;
  }

  // Compute boundary comparisons (top↔upper and lower↔bottom)
  const rankGroup = (groupName) => {
    const list = groups[groupName] || [];
    if (list.length === 0) return [];
    const idSet = new Set(list.map((p) => p.id));
    const comps = comparisons.filter(
      (c) => idSet.has(c.winner) && idSet.has(c.loser)
    );
    const graph = buildGraph(comps);
    const visited = new Set();
    const stack = [];
    const dfs = (node) => {
      if (visited.has(node)) return;
      visited.add(node);
      graph[node]?.forEach((n) => dfs(n));
      stack.push(node);
    };
    list.forEach((p) => dfs(p.id));
    const idMap = Object.fromEntries(list.map((p) => [p.id, p]));
    return stack.reverse().map((id) => idMap[id]);
  };

  const topRanked = rankGroup('top');
  const upperRanked = rankGroup('upper');
  if (topRanked.length && upperRanked.length) {
    const worstTop = topRanked[topRanked.length - 1];
    const bestUpper = upperRanked[0];
    if (
      !alreadyCompared(worstTop.id, bestUpper.id, comparisons) &&
      !isSkipped(worstTop.id, bestUpper.id)
    ) {
      return [worstTop, bestUpper];
    }
  }

  const lowerRanked = rankGroup('lower');
  const bottomRanked = rankGroup('bottom');
  if (lowerRanked.length && bottomRanked.length) {
    const worstLower = lowerRanked[lowerRanked.length - 1];
    const bestBottom = bottomRanked[0];
    if (
      !alreadyCompared(worstLower.id, bestBottom.id, comparisons) &&
      !isSkipped(worstLower.id, bestBottom.id)
    ) {
      return [worstLower, bestBottom];
    }
  }

  // All groups resolved and boundaries checked
  return [];
}

// Estimate how many additional comparisons remain
export function estimateRemainingComparisons(
  comparisons,
  players,
  skippedPairs
) {
  const simulated = comparisons.map((c) => ({ ...c }));
  let count = 0;
  let next = suggestNextPair(simulated, players, skippedPairs);

  while (next.length > 0) {
    // arbitrarily assume the first player wins to progress the simulation
    simulated.push({ winner: next[0].id, loser: next[1].id });
    count++;
    next = suggestNextPair(simulated, players, skippedPairs);
  }

  return count;
}

// Build direct comparisons against an anchor player
export function buildAnchorComparisons(anchorId, players, betterIds = []) {
  const betterSet = new Set(betterIds);
  return players.map((p) =>
    betterSet.has(p.id)
      ? { winner: p.id, loser: anchorId }
      : { winner: anchorId, loser: p.id }
  );
}

// ========== 🏁 FINAL RANKING LOGIC ==========

// Topological sort using DFS
// Topological sort helper for a subset of players
const topologicalSort = (comparisons, players) => {
  const graph = buildGraph(comparisons);
  const visited = new Set();
  const stack = [];

  const dfs = (node) => {
    if (visited.has(node)) return;
    visited.add(node);
    if (graph[node]) {
      graph[node].forEach((neighbor) => dfs(neighbor));
    }
    stack.push(node);
  };

  players.forEach((p) => {
    if (!visited.has(p.id)) dfs(p.id);
  });

  const idToPlayer = Object.fromEntries(players.map((p) => [p.id, p]));
  return stack
    .reverse()
    .map((id) => idToPlayer[id])
    .filter(Boolean);
};

export const generateRankingFromComparisons = (
  rawComparisons,
  players,
  options = {}
) => {
  const {
    topTier = [],
    bottomTier = [],
    anchor,
    firstPlace = null,
    lastPlace = null,
  } = options;

  const comparisons = scopeToPool(
    rawComparisons,
    new Set(players.map((p) => p.id))
  );

  // Position lock-ins are a direct instruction from the user, so they are
  // applied to the finished order rather than left to emerge from the
  // comparison graph. Previously a first-place lock-in only landed at rank 1
  // as a side effect of the boundary re-sort, and not at all when the player
  // was outside the top tier.
  const applyLockIns = (ranked) => {
    if (!firstPlace && !lastPlace) return ranked;

    const first = ranked.find((p) => p.id === firstPlace) || null;
    const last =
      lastPlace && lastPlace !== firstPlace
        ? ranked.find((p) => p.id === lastPlace) || null
        : null;

    const middle = ranked.filter((p) => p !== first && p !== last);
    return [...(first ? [first] : []), ...middle, ...(last ? [last] : [])];
  };

  // Fallback to simple topological sort if no grouping info provided
  if (!anchor && topTier.length === 0 && bottomTier.length === 0) {
    return applyLockIns(topologicalSort(comparisons, players));
  }

  const idMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const anchorPlayer = anchor ? idMap[anchor] : null;

  // Step 1: segment players
  const groups = { top: [], upper: [], lower: [], bottom: [] };
  players.forEach((p) => {
    if (p.id === anchor) return;
    if (topTier.includes(p.id)) groups.top.push(p);
    else if (bottomTier.includes(p.id)) groups.bottom.push(p);
    else if (anchor) {
      const beatAnchor = comparisons.some(
        (c) => c.winner === p.id && c.loser === anchor
      );
      groups[beatAnchor ? 'upper' : 'lower'].push(p);
    } else {
      groups.upper.push(p);
    }
  });

  const rankGroup = (list) => {
    if (!list.length) return [];
    const set = new Set(list.map((p) => p.id));
    const comps = comparisons.filter(
      (c) => set.has(c.winner) && set.has(c.loser)
    );
    return topologicalSort(comps, list);
  };

  let rankedTop = rankGroup(groups.top);
  let rankedUpper = rankGroup(groups.upper);
  let rankedLower = rankGroup(groups.lower);
  let rankedBottom = rankGroup(groups.bottom);

  const boundaryCheck = (high, low) => {
    if (high.length === 0 || low.length === 0) return [high, low];
    const highWorst = high[high.length - 1];
    const lowBest = low[0];
    const res = comparisons.find(
      (c) =>
        (c.winner === highWorst.id && c.loser === lowBest.id) ||
        (c.winner === lowBest.id && c.loser === highWorst.id)
    );
    if (res && res.winner === lowBest.id) {
      const newHigh = [...high.slice(0, -1), lowBest];
      const newLow = [highWorst, ...low.slice(1)];
      return [rankGroup(newHigh), rankGroup(newLow)];
    }
    return [high, low];
  };

  [rankedTop, rankedUpper] = boundaryCheck(rankedTop, rankedUpper);
  [rankedUpper, rankedLower] = boundaryCheck(rankedUpper, rankedLower);
  [rankedLower, rankedBottom] = boundaryCheck(rankedLower, rankedBottom);

  const final = [
    ...rankedTop,
    ...rankedUpper,
    ...(anchorPlayer ? [anchorPlayer] : []),
    ...rankedLower,
    ...rankedBottom,
  ];

  return applyLockIns(final);
};
