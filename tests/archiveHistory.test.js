import { describe, it, expect, vi, beforeEach } from 'vitest';

// The archive is the record of every ranking the owner has published. Three
// things made that record wrong: each archive was dated by the save that
// replaced it, an idle save archived an identical board (and wiped the
// movement arrows by becoming "the previous ranking"), and boards from before
// entries kept their roster id compared as all-new.

vi.mock('@/firebaseConfig', () => ({ db: {}, auth: {}, googleProvider: {} }));

const SERVER_TIME = { __server: true };
const store = vi.hoisted(() => ({ live: null, sets: [], updates: [] }));

vi.mock('firebase/firestore', () => {
  let counter = 0;
  return {
    collection: (_db, path) => ({ path }),
    doc: (parent, ...rest) =>
      rest.length
        ? { path: rest.join('/') }
        : {
            path: `${parent.path}/new-${(counter += 1)}`,
            id: `new-${counter}`,
          },
    query: (...args) => args,
    where: () => ({}),
    orderBy: () => ({}),
    limit: () => ({}),
    serverTimestamp: () => SERVER_TIME,
    addDoc: vi.fn(),
    getDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getDocs: vi.fn(async () => ({
      empty: false,
      docs: [{ id: 'live', ref: { path: 'live' }, data: () => store.live }],
    })),
    runTransaction: vi.fn(async (_db, body) =>
      body({
        get: async () => ({ exists: () => true, data: () => store.live }),
        set: (ref, data) => store.sets.push({ ref, data }),
        update: (ref, data) => store.updates.push({ ref, data }),
      })
    ),
  };
});

const { saveCurrentPersonalRankings } = await import(
  '@/firebase/personalRankingHelpers.js'
);
const { withSavedDates } = await import('@/hooks/usePersonalRankingHistory.js');
const { formatArchiveDate, rankingDate } = await import(
  '@/utils/formatting/rankingDates.js'
);
const { calculateRankingMovement } = await import('@/utils/rankingMovement.js');
const { summariseRankingChange } = await import(
  '@/utils/rankings/rankingSummary.js'
);

const stamp = (y, m, d) => ({ toDate: () => new Date(y, m - 1, d, 12) });
const board = (...ids) => ids.map((id) => ({ id, name: id }));

beforeEach(() => {
  store.sets = [];
  store.updates = [];
  store.live = {
    isCurrent: true,
    version: 3,
    rankings: board('allen', 'jackson', 'burrow'),
    notes: '',
    createdAt: stamp(2026, 8, 1),
    savedAt: stamp(2026, 9, 1),
    updatedAt: stamp(2026, 9, 20), // a note typed later moves only this
  };
});

describe('saving the personal board', () => {
  it('dates the archive by when its board was saved, not when it was replaced', async () => {
    await saveCurrentPersonalRankings(board('jackson', 'allen', 'burrow'));

    expect(store.sets).toHaveLength(1);
    const archive = store.sets[0].data;
    expect(archive.savedAt).toBe(store.live.savedAt);
    expect(archive.createdAt).toBe(SERVER_TIME);
    expect(store.updates[0].data.savedAt).toBe(SERVER_TIME);
  });

  it('does not archive a save that left the order alone', async () => {
    const result = await saveCurrentPersonalRankings(
      board('allen', 'jackson', 'burrow')
    );

    expect(store.sets).toHaveLength(0);
    expect(result).toMatchObject({ archiveId: null, reordered: false });
    // The board keeps the date its order was actually set.
    expect(store.updates[0].data).not.toHaveProperty('savedAt');
  });

  it('archives a board that was cleared', async () => {
    await saveCurrentPersonalRankings([]);
    expect(store.sets).toHaveLength(1);
  });
});

describe('archive dates', () => {
  it('works out the save date of an old archive from the one below it', () => {
    const archives = withSavedDates([
      { id: 'new', savedAt: stamp(2026, 9, 1), createdAt: stamp(2026, 9, 10) },
      { id: 'old-1', createdAt: stamp(2026, 8, 20) },
      { id: 'old-2', createdAt: stamp(2026, 8, 5) },
    ]);

    expect(rankingDate(archives[0])).toEqual(new Date(2026, 8, 1, 12));
    expect(rankingDate(archives[1])).toEqual(new Date(2026, 7, 5, 12));
    expect(archives[2].dateIsReplacement).toBe(true);
    expect(formatArchiveDate(archives[2])).toBe('Replaced Aug 5, 2026');
    expect(formatArchiveDate(archives[1])).toBe('Aug 5, 2026');
  });

  it('prefers the save date over a later note edit on the live board', () => {
    expect(rankingDate(store.live)).toEqual(new Date(2026, 8, 1, 12));
  });
});

describe('comparing against boards from before roster ids', () => {
  const legacy = [
    { id: 'qb-1699-1-abc', name: 'Josh Allen' },
    { id: 'qb-1699-2-def', name: 'Lamar Jackson' },
    { id: 'qb-1699-3-ghi', name: 'Joe Burrow' },
  ];
  const now = [
    { id: 'lamar-jackson', name: 'Lamar Jackson' },
    { id: 'josh-allen', name: 'Josh Allen' },
    { id: 'jalen-hurts', name: 'Jalen Hurts' },
  ];

  it('pairs quarterbacks by name when the id changed', () => {
    const movement = calculateRankingMovement(now, legacy);
    expect(movement['lamar-jackson']).toMatchObject({
      direction: 'up',
      positions: 1,
      isNew: false,
    });
    expect(movement['josh-allen']).toMatchObject({
      direction: 'down',
      isNew: false,
    });
    expect(movement['jalen-hurts'].isNew).toBe(true);
  });

  it('counts one addition and one removal, not three of each', () => {
    const summary = summariseRankingChange(now, legacy);
    expect(summary.added).toBe(1);
    expect(summary.removed).toBe(1);
  });

  it('never pairs two players who only share a name with someone already matched', () => {
    const movement = calculateRankingMovement(
      [
        { id: 'a', name: 'Same Name' },
        { id: 'b', name: 'Same Name' },
      ],
      [{ id: 'a', name: 'Same Name' }]
    );
    expect(movement.a.isNew).toBe(false);
    expect(movement.b.isNew).toBe(true);
  });
});
