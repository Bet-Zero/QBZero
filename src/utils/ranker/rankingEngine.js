// 📁 src/utils/ranker/rankingEngine.js

// ========== 🧠 UTILITY FUNCTIONS ==========

// Determine if a direct comparison already exists
const alreadyCompared = (a, b, comparisons) =>
  comparisons.some(
    (c) =>
      (c.winner === a && c.loser === b) || (c.winner === b && c.loser === a)
  );

// Canonical, order-independent key for a pair of player ids.
// Ordered with a comparison rather than [a, b].sort() so it allocates nothing:
// this is called for every candidate pair inside the estimator's inner loop.
export const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

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

    // Players are addressed by index into bitsets rather than by id into Sets
    // and string keys. This function runs once per simulated comparison inside
    // estimateRemainingComparisons, so rebuilding Sets and `a->b` strings here
    // dominated the cost of the whole session (see the comment on that
    // function). Behaviour is unchanged; only the representation differs.
    const n = groupPlayers.length;
    const indexOf = new Map(groupPlayers.map((p, i) => [p.id, i]));
    const words = Math.ceil(n / 32) || 1;

    const bitSet = (bits, row, col) => {
      bits[row * words + (col >>> 5)] |= 1 << (col & 31);
    };
    const bitGet = (bits, row, col) =>
      (bits[row * words + (col >>> 5)] & (1 << (col & 31))) !== 0;

    // `beats[i]` starts as i's direct wins and is closed transitively below.
    const beats = new Uint32Array(n * words);
    // `compared[i]` records a recorded comparison in either direction.
    const compared = new Uint32Array(n * words);
    const usage = new Int32Array(n);

    groupComps.forEach(({ winner, loser }) => {
      const w = indexOf.get(winner);
      const l = indexOf.get(loser);
      bitSet(beats, w, l);
      bitSet(compared, w, l);
      bitSet(compared, l, w);
      usage[w] += 1;
      usage[l] += 1;
    });

    // Transitive closure over the win graph. The k/i loop order is the standard
    // reachability form and stays correct when the comparisons contain a cycle.
    for (let k = 0; k < n; k++) {
      const kOff = k * words;
      for (let i = 0; i < n; i++) {
        if (!bitGet(beats, i, k)) continue;
        const iOff = i * words;
        for (let w = 0; w < words; w++) beats[iOff + w] |= beats[kOff + w];
      }
    }

    // A skipped pair is off the table but, unlike a comparison, tells us
    // nothing about ordering. Resolving the skip set to bits once per group is
    // O(number of skips); testing each candidate pair against the set directly
    // meant building a key string for every pair on every call.
    const skippedBits = new Uint32Array(n * words);
    if (skippedPairs?.size) {
      skippedPairs.forEach((key) => {
        // Keys come from pairKey, which joins two ids with '|'.
        const sep = key.indexOf('|');
        if (sep < 0) return;
        const i = indexOf.get(key.slice(0, sep));
        const j = indexOf.get(key.slice(sep + 1));
        if (i === undefined || j === undefined) return;
        bitSet(skippedBits, i, j);
        bitSet(skippedBits, j, i);
      });
    }

    const offTheTable = (i, j) =>
      bitGet(compared, i, j) || bitGet(skippedBits, i, j);

    // Phase 1: New vs New inside the group
    const unused = [];
    for (let i = 0; i < n; i++) if (usage[i] === 0) unused.push(i);
    if (unused.length >= 2) {
      for (let i = 0; i < unused.length; i++) {
        for (let j = i + 1; j < unused.length; j++) {
          if (!offTheTable(unused[i], unused[j])) {
            return [groupPlayers[unused[i]], groupPlayers[unused[j]]];
          }
        }
      }
    }

    // Phase 2: Usage-balanced unresolved matchups. The lowest score wins, with
    // the earliest pair in i/j order breaking ties - matching the stable sort
    // this replaced.
    let bestScore = Infinity;
    let bestPair = null;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (offTheTable(i, j)) continue;
        if (bitGet(beats, i, j) || bitGet(beats, j, i)) continue;

        const score = usage[i] + usage[j] + Math.abs(usage[i] - usage[j]) * 2;
        if (score < bestScore) {
          bestScore = score;
          bestPair = [groupPlayers[i], groupPlayers[j]];
        }
      }
    }

    return bestPair || [];
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
