import { describe, it, expect } from 'vitest';
import {
  encodeRankerState,
  decodeRankerState,
  MAX_ENCODED_LENGTH,
} from '@/utils/ranker/rankerStateCodec.js';
import { quarterbacks } from '@/features/ranker/quarterbacks.js';

const buildSession = () => {
  const comparisonResults = [];
  for (let i = 0; i < 116; i += 1) {
    comparisonResults.push({
      winner: quarterbacks[i % 42].id,
      loser: quarterbacks[(i + 7) % 42].id,
    });
  }
  return {
    playerPool: quarterbacks,
    setupData: {
      topTier: quarterbacks.slice(0, 11).map((p) => p.id),
      bottomTier: quarterbacks.slice(-11).map((p) => p.id),
      anchor: quarterbacks[20].id,
      firstPlace: quarterbacks[0].id,
      lastPlace: null,
    },
    comparisonResults,
    finalRanking: quarterbacks,
  };
};

describe('ranker state codec', () => {
  it('round trips a full session', () => {
    const session = buildSession();
    const decoded = decodeRankerState(encodeRankerState(session));

    expect(decoded.playerPool.map((p) => p.id)).toEqual(
      session.playerPool.map((p) => p.id)
    );
    expect(decoded.comparisonResults).toEqual(session.comparisonResults);
    expect(decoded.finalRanking.map((p) => p.id)).toEqual(
      session.finalRanking.map((p) => p.id)
    );
    expect(decoded.setupData).toEqual(session.setupData);
  });

  it('keeps a session over the whole roster inside the shareable URL budget', () => {
    const encoded = encodeRankerState(buildSession());
    expect(encoded.length).toBeLessThan(MAX_ENCODED_LENGTH);
  });

  // The pool scales with the roster, and the roster only grows. Asserting real
  // headroom rather than a bare pass means the next batch of quarterbacks does
  // not quietly make full sessions unshareable.
  it('leaves room for the roster to keep growing', () => {
    const encoded = encodeRankerState(buildSession());
    const perPlayer = encoded.length / quarterbacks.length;
    const remaining = (MAX_ENCODED_LENGTH - encoded.length) / perPlayer;
    expect(remaining).toBeGreaterThan(20);
  });

  // Links shared before the pool encoding changed have to keep working.
  it('still decodes a v1 payload', () => {
    const v1 = {
      v: 1,
      p: [
        ['c-j-stroud', 'C.J. Stroud', 'HOU'],
        ['josh-allen', 'Josh Allen', 'BUF'],
      ],
      c: [0, 1],
      r: [1, 0],
      s: { t: [1], b: [0], a: 0, f: 1, l: -1 },
    };
    const encoded = btoa(JSON.stringify(v1))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const decoded = decodeRankerState(encoded);
    expect(decoded.playerPool.map((p) => p.id)).toEqual([
      'c-j-stroud',
      'josh-allen',
    ]);
    expect(decoded.comparisonResults).toEqual([
      { winner: 'c-j-stroud', loser: 'josh-allen' },
    ]);
    expect(decoded.setupData.anchor).toBe('c-j-stroud');
  });

  it('survives a URLSearchParams round trip', () => {
    const encoded = encodeRankerState(buildSession());
    const parsed = new URLSearchParams(`?state=${encoded}`).get('state');
    expect(parsed).toBe(encoded);
    expect(decodeRankerState(parsed)).not.toBeNull();
  });

  it('encodes names outside Latin-1, which raw btoa cannot', () => {
    const session = {
      playerPool: [{ id: 'p1', name: 'José Peña — QB' }],
      setupData: null,
      comparisonResults: [],
      finalRanking: [],
    };
    expect(() => btoa(JSON.stringify(session))).toThrow();

    const decoded = decodeRankerState(encodeRankerState(session));
    expect(decoded.playerPool[0].name).toBe('José Peña — QB');
  });

  it('returns null for missing, corrupted, or foreign payloads', () => {
    expect(decodeRankerState('')).toBeNull();
    expect(decodeRankerState(null)).toBeNull();
    expect(decodeRankerState('not-base64!!')).toBeNull();
    expect(decodeRankerState(btoa('{"v":99,"p":[]}'))).toBeNull();
  });

  it('drops comparisons referencing players outside the pool', () => {
    const encoded = encodeRankerState({
      playerPool: [{ id: 'a', name: 'A', team: 'BUF' }],
      setupData: null,
      // 'ghost' is not in the pool, so it has no index and must not survive.
      comparisonResults: [{ winner: 'ghost', loser: 'a' }],
      finalRanking: [],
    });

    expect(decodeRankerState(encoded).comparisonResults).toEqual([]);
  });
});
