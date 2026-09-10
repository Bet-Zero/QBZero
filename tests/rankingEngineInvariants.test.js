import { describe, it, expect } from 'vitest';
import {
  suggestNextPair,
  estimateRemainingComparisons,
  pairKey,
} from '@/utils/ranker/rankingEngine.js';
import { quarterbacks } from '@/features/ranker/quarterbacks.js';

// Deterministic PRNG so a failure is reproducible.
const makeRandom = (seed) => () =>
  ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

const GROUPS = ['top', 'upper', 'lower', 'bottom', 'anchor'];

const buildPlayers = (size, grouped) =>
  quarterbacks.slice(0, size).map((p, i) => ({
    ...p,
    group: grouped ? GROUPS[i % GROUPS.length] : 'upper',
  }));

// Transitive closure of the win graph, computed independently of the engine.
const reachable = (comparisons, from) => {
  const graph = new Map();
  comparisons.forEach(({ winner, loser }) => {
    if (!graph.has(winner)) graph.set(winner, []);
    graph.get(winner).push(loser);
  });
  const seen = new Set();
  const stack = [...(graph.get(from) || [])];
  while (stack.length) {
    const next = stack.pop();
    if (seen.has(next)) continue;
    seen.add(next);
    (graph.get(next) || []).forEach((n) => stack.push(n));
  }
  return seen;
};

/**
 * Drive a full session, asserting the engine's contract at every decision
 * point. These are properties rather than recorded outputs, so a deliberate
 * change to the pairing heuristic will not fail them but a broken one will.
 */
const runSession = (players, random, { allowSkips }) => {
  const comparisons = [];
  const skipped = new Set();
  let answered = 0;
  let steps = 0;

  for (;;) {
    const pair = suggestNextPair(comparisons, players, skipped);
    if (!pair.length) break;

    expect(pair).toHaveLength(2);
    expect(pair[0].id).not.toBe(pair[1].id);

    const [a, b] = pair.map((p) => p.id);

    // Never re-ask a pair that was already answered or skipped.
    expect(
      comparisons.some(
        (c) =>
          (c.winner === a && c.loser === b) || (c.winner === b && c.loser === a)
      )
    ).toBe(false);
    expect(skipped.has(pairKey(a, b))).toBe(false);

    // Never ask for an ordering already implied by earlier answers, as long as
    // both players sit in the same group (the engine deliberately asks across
    // group boundaries to stitch the segments together).
    if (pair[0].group === pair[1].group) {
      expect(reachable(comparisons, a).has(b)).toBe(false);
      expect(reachable(comparisons, b).has(a)).toBe(false);
    }

    const r = random();
    if (allowSkips && r < 0.15) {
      skipped.add(pairKey(a, b));
    } else {
      comparisons.push(
        r < 0.575 ? { winner: a, loser: b } : { winner: b, loser: a }
      );
      answered += 1;
    }

    steps += 1;
    expect(steps).toBeLessThan(players.length * players.length);
  }

  return { comparisons, skipped, answered, steps };
};

describe('suggestNextPair contract', () => {
  const cases = [];
  for (const size of [2, 3, 7, 16, 42]) {
    for (const grouped of [false, true]) {
      for (const allowSkips of [false, true]) {
        cases.push({ size, grouped, allowSkips });
      }
    }
  }

  cases.forEach(({ size, grouped, allowSkips }) => {
    it(`holds for ${size} players (${grouped ? 'grouped' : 'flat'}${
      allowSkips ? ', with skips' : ''
    })`, () => {
      const players = buildPlayers(size, grouped);
      const session = runSession(players, makeRandom(size * 7 + 1), {
        allowSkips,
      });
      // A session must terminate having done something (except the trivial
      // 2-player flat case, which is one comparison).
      expect(session.steps).toBeGreaterThan(0);
    });
  });
});

describe('estimateRemainingComparisons', () => {
  it('predicts the exact number of steps its own assumption produces', () => {
    // The estimate simulates "first player always wins". Answering that way for
    // real must consume exactly the predicted number of comparisons.
    const players = buildPlayers(16, false);
    const predicted = estimateRemainingComparisons([], players);

    const comparisons = [];
    let actual = 0;
    for (;;) {
      const pair = suggestNextPair(comparisons, players);
      if (!pair.length) break;
      comparisons.push({ winner: pair[0].id, loser: pair[1].id });
      actual += 1;
    }

    expect(actual).toBe(predicted);
  });

  it('reaches zero exactly when the session ends', () => {
    const players = buildPlayers(12, true);
    const random = makeRandom(99);
    const { comparisons, skipped } = runSession(players, random, {
      allowSkips: true,
    });

    expect(estimateRemainingComparisons(comparisons, players, skipped)).toBe(0);
    expect(suggestNextPair(comparisons, players, skipped)).toEqual([]);
  });

  it('accounts for skips, which can raise the total rather than lower it', () => {
    // Skipping does not simply subtract a comparison: declining to order A and
    // B also gives up every ordering that edge would have implied, so the
    // engine may need more questions elsewhere. The estimate must reflect
    // whatever actually happens, in either direction.
    const players = buildPlayers(8, false);
    const first = suggestNextPair([], players);
    const skipped = new Set([pairKey(first[0].id, first[1].id)]);

    const predicted = estimateRemainingComparisons([], players, skipped);

    const comparisons = [];
    let actual = 0;
    for (;;) {
      const pair = suggestNextPair(comparisons, players, skipped);
      if (!pair.length) break;
      // The skipped pair is never offered again.
      expect(pairKey(pair[0].id, pair[1].id)).not.toBe(
        pairKey(first[0].id, first[1].id)
      );
      comparisons.push({ winner: pair[0].id, loser: pair[1].id });
      actual += 1;
    }

    expect(actual).toBe(predicted);
  });
});
