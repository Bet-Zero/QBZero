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

  it('keeps a full 42-QB session inside the shareable URL budget', () => {
    const encoded = encodeRankerState(buildSession());
    expect(encoded.length).toBeLessThan(MAX_ENCODED_LENGTH);
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
