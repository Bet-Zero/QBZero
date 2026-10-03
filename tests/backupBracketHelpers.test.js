import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = {};
vi.mock('@/firebaseConfig', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: () => 'backupBrackets/main',
  serverTimestamp: () => 'now',
  setDoc: vi.fn(async (_ref, data) => {
    store.data = data;
  }),
  getDoc: vi.fn(async () => ({
    exists: () => Boolean(store.data),
    data: () => store.data,
  })),
}));

const { fetchBracketPicks, saveBracketPicks } = await import(
  '@/firebase/backupBracketHelpers'
);

describe('backup bracket Firestore helpers', () => {
  beforeEach(() => {
    delete store.data;
  });

  it('stores rounds without nested arrays, which Firestore rejects', async () => {
    const winners = [['a', null, 'c', null], ['a', null], [null]];
    await saveBracketPicks(winners);
    expect(Array.isArray(store.data.rounds)).toBe(false);
    expect(
      Object.values(store.data.rounds).every(
        (round) =>
          Array.isArray(round) && round.every((pick) => !Array.isArray(pick))
      )
    ).toBe(true);
    expect(await fetchBracketPicks()).toEqual(winners);
  });

  it('returns null when nothing is saved', async () => {
    expect(await fetchBracketPicks()).toBeNull();
  });
});
