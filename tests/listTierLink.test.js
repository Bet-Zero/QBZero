import { describe, it, expect, vi, beforeEach } from 'vitest';

const taken = new Set();
const addDoc = vi.fn(async () => ({ id: 'new-board' }));
vi.mock('@/firebaseConfig', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: () => 'tierLists',
  where: (field, op, value) => value,
  query: (ref, name) => name,
  getDocs: async (name) => ({ empty: !taken.has(name) }),
  addDoc: (...a) => addDoc(...a),
  serverTimestamp: () => 'now',
}));
const fetchList = vi.fn();
const saveList = vi.fn(async () => {});
vi.mock('@/firebase/listHelpers', () => ({
  fetchList: (...a) => fetchList(...a),
  saveList: (...a) => saveList(...a),
}));

const { createTierBoardFromList, sendTierBoardToList } = await import(
  '@/firebase/listTierLink'
);

beforeEach(() => {
  taken.clear();
  addDoc.mockClear();
  fetchList.mockReset();
  saveList.mockClear();
});

describe('createTierBoardFromList', () => {
  it('writes the list as tiers and remembers where it came from', async () => {
    const id = await createTierBoardFromList({
      id: 'l1',
      name: 'Top QBs',
      playerOrder: ['divider::Elite', 'a', 'divider::Good', 'b'],
    });
    expect(id).toBe('new-board');
    expect(addDoc.mock.calls[0][1]).toMatchObject({
      name: 'Top QBs',
      tiers: { Elite: ['a'], Good: ['b'], Pool: [] },
      tierOrder: ['Elite', 'Good', 'Pool'],
      sourceList: { id: 'l1', name: 'Top QBs' },
    });
  });

  it('numbers the name rather than clashing with an existing board', async () => {
    taken.add('Top QBs');
    taken.add('Top QBs 2');
    await createTierBoardFromList({ id: 'l1', name: 'Top QBs' });
    expect(addDoc.mock.calls[0][1].name).toBe('Top QBs 3');
  });
});

describe('sendTierBoardToList', () => {
  it('rewrites the list order and keeps notes for players still on it', async () => {
    fetchList.mockResolvedValue({
      id: 'l1',
      playerNotes: { a: 'keep', z: 'drop' },
    });
    await sendTierBoardToList('l1', {
      tiers: { S: ['a'], A: ['b'], Pool: ['c'] },
      tierOrder: ['S', 'A', 'Pool'],
    });
    expect(saveList).toHaveBeenCalledWith('l1', {
      playerOrder: [
        'divider::S',
        'a',
        'divider::A',
        'b',
        'divider::Unplaced',
        'c',
      ],
      playerIds: ['a', 'b', 'c'],
      playerNotes: { a: 'keep' },
    });
  });

  it('refuses when the list has been deleted', async () => {
    fetchList.mockResolvedValue(null);
    await expect(
      sendTierBoardToList('gone', { tiers: {}, tierOrder: [] })
    ).rejects.toThrow('no longer exists');
    expect(saveList).not.toHaveBeenCalled();
  });
});
