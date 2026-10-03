import { describe, it, expect, vi, beforeEach } from 'vitest';

// Offline, Firestore's getDocs answers from the local cache instead of
// rejecting. On a first visit that cache is empty, so the live board looked
// like it had never been saved and the public page said "No rankings
// available" rather than that it could not load them.
const getDocs = vi.fn();
vi.mock('@/firebaseConfig', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: () => ({}),
  doc: () => ({}),
  addDoc: vi.fn(),
  getDocs: (...args) => getDocs(...args),
  getDoc: vi.fn(),
  query: () => ({}),
  orderBy: () => ({}),
  limit: () => ({}),
  serverTimestamp: () => ({}),
  where: () => ({}),
  deleteDoc: vi.fn(),
  runTransaction: vi.fn(),
}));

const { getCurrentPersonalRanking, PersonalRankingUnavailableError } =
  await import('@/firebase/personalRankingHelpers.js');

const snapshot = (docs, fromCache) => ({
  empty: docs.length === 0,
  docs,
  metadata: { fromCache },
});

beforeEach(() => getDocs.mockReset());

describe('getCurrentPersonalRanking', () => {
  it('rejects when an empty answer came from the cache', async () => {
    getDocs.mockResolvedValue(snapshot([], true));
    await expect(getCurrentPersonalRanking()).rejects.toBeInstanceOf(
      PersonalRankingUnavailableError
    );
  });

  it('returns null when the server says there is no board', async () => {
    getDocs.mockResolvedValue(snapshot([], false));
    await expect(getCurrentPersonalRanking()).resolves.toBeNull();
  });

  it('returns a cached board rather than failing', async () => {
    const board = { id: 'live', data: () => ({ rankings: [{ id: 'a' }] }) };
    getDocs.mockResolvedValue(snapshot([board], true));
    await expect(getCurrentPersonalRanking()).resolves.toEqual({
      id: 'live',
      rankings: [{ id: 'a' }],
    });
  });
});
