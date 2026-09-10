import { describe, it, expect } from 'vitest';
import {
  generateRankingFromComparisons,
  suggestNextPair,
  detectComparisonCycles,
} from '@/utils/ranker/rankingEngine.js';

const players = (...ids) => ids.map((id) => ({ id, name: id.toUpperCase() }));

describe('cycle detection', () => {
  it('reports a three-way contradiction', () => {
    const cycles = detectComparisonCycles(
      [
        { winner: 'a', loser: 'b' },
        { winner: 'b', loser: 'c' },
        { winner: 'c', loser: 'a' },
      ],
      players('a', 'b', 'c')
    );

    expect(cycles).toHaveLength(1);
    expect([...cycles[0]].sort()).toEqual(['a', 'b', 'c']);
  });

  it('reports a direct contradiction between two players', () => {
    const cycles = detectComparisonCycles(
      [
        { winner: 'a', loser: 'b' },
        { winner: 'b', loser: 'a' },
      ],
      players('a', 'b')
    );

    expect(cycles).toHaveLength(1);
    expect([...cycles[0]].sort()).toEqual(['a', 'b']);
  });

  it('reports nothing for a consistent set of comparisons', () => {
    expect(
      detectComparisonCycles(
        [
          { winner: 'a', loser: 'b' },
          { winner: 'a', loser: 'c' },
          { winner: 'b', loser: 'c' },
        ],
        players('a', 'b', 'c')
      )
    ).toEqual([]);
  });

  it('ignores comparisons involving players outside the pool', () => {
    expect(
      detectComparisonCycles(
        [
          { winner: 'a', loser: 'ghost' },
          { winner: 'ghost', loser: 'a' },
        ],
        players('a', 'b')
      )
    ).toEqual([]);
  });

  it('still produces a complete ranking when a cycle is present', () => {
    const pool = players('a', 'b', 'c');
    const ranking = generateRankingFromComparisons(
      [
        { winner: 'a', loser: 'b' },
        { winner: 'b', loser: 'c' },
        { winner: 'c', loser: 'a' },
      ],
      pool
    );

    expect(ranking.filter(Boolean)).toHaveLength(3);
    expect(ranking.map((p) => p.id).sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('comparisons referencing players outside the pool', () => {
  const pool = players('1', '2', '3');

  it('does not let a foreign id reorder the ranking', () => {
    const clean = generateRankingFromComparisons([], pool).map((p) => p.id);
    const withGhost = generateRankingFromComparisons(
      [{ winner: 'ghost', loser: '1' }],
      pool
    ).map((p) => p.id);

    expect(withGhost).toEqual(clean);
  });

  it('never yields undefined entries', () => {
    const ranking = generateRankingFromComparisons(
      [
        { winner: 'ghost', loser: '1' },
        { winner: '2', loser: 'phantom' },
      ],
      pool
    );

    expect(ranking).toHaveLength(3);
    expect(ranking.every(Boolean)).toBe(true);
  });

  it('does not let a foreign id suppress a real matchup', () => {
    const pair = suggestNextPair([{ winner: 'ghost', loser: '1' }], pool);
    expect(pair).toHaveLength(2);
    expect(pair.every(Boolean)).toBe(true);
  });
});

describe('position lock-ins', () => {
  const pool = players('a', 'b', 'c', 'd', 'e');

  it('places a first-place lock-in first even against contrary comparisons', () => {
    const ranking = generateRankingFromComparisons(
      // Every other player is recorded as beating the lock-in.
      pool.filter((p) => p.id !== 'd').map((p) => ({
        winner: p.id,
        loser: 'd',
      })),
      pool,
      { firstPlace: 'd' }
    );

    expect(ranking[0].id).toBe('d');
    expect(ranking).toHaveLength(5);
  });

  it('places a last-place lock-in last even against contrary comparisons', () => {
    const ranking = generateRankingFromComparisons(
      pool.filter((p) => p.id !== 'b').map((p) => ({
        winner: 'b',
        loser: p.id,
      })),
      pool,
      { lastPlace: 'b' }
    );

    expect(ranking[ranking.length - 1].id).toBe('b');
    expect(ranking).toHaveLength(5);
  });

  it('honours lock-ins alongside tier and anchor grouping', () => {
    const ranking = generateRankingFromComparisons(
      [
        { winner: 'a', loser: 'c' },
        { winner: 'c', loser: 'e' },
      ],
      pool,
      {
        topTier: ['a'],
        bottomTier: ['e'],
        anchor: 'c',
        firstPlace: 'd',
        lastPlace: 'b',
      }
    );

    expect(ranking[0].id).toBe('d');
    expect(ranking[ranking.length - 1].id).toBe('b');
    expect(ranking.map((p) => p.id).sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('keeps every player exactly once', () => {
    const ranking = generateRankingFromComparisons([], pool, {
      firstPlace: 'e',
      lastPlace: 'a',
    });

    expect(new Set(ranking.map((p) => p.id)).size).toBe(pool.length);
  });
});
