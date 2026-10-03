import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatVersionDay,
  sortTierListVersions,
  versionDayKey,
  versionTitle,
} from '@/utils/tierMaker/tierBoard';

const ops = [];
const versionDocs = [];
vi.mock('@/firebaseConfig', () => ({ db: {} }));
vi.mock('../src/firebaseConfig', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: (db, ...path) => path.join('/'),
  doc: (dbOrCol, ...path) =>
    typeof dbOrCol === 'string' ? [dbOrCol, ...path].join('/') : path.join('/'),
  getDocs: async (ref) => ({
    docs: ref.endsWith('/versions') ? versionDocs : [],
    empty: true,
  }),
  getDoc: vi.fn(),
  addDoc: async (ref, data) => {
    ops.push(['add', ref, data]);
    return { id: 'named1' };
  },
  updateDoc: vi.fn(),
  deleteDoc: async (ref) => ops.push(['delete', ref]),
  query: vi.fn(),
  where: vi.fn(),
  arrayUnion: vi.fn(),
  serverTimestamp: () => 'now',
  writeBatch: () => ({
    update: (ref, data) => ops.push(['update', ref, data]),
    set: (ref, data) => ops.push(['set', ref, data]),
    commit: async () => ops.push(['commit']),
  }),
}));

const {
  saveTierList,
  deleteTierList,
  fetchTierListVersions,
  saveNamedTierListVersion,
} = await import('@/firebase/listHelpers');

beforeEach(() => {
  ops.length = 0;
  versionDocs.length = 0;
});

describe('tier list versions', () => {
  it('saves the board and today’s version in one write', async () => {
    const board = { tiers: { S: ['a'], Pool: [] }, tierOrder: ['S', 'Pool'] };
    await saveTierList('t1', board);
    const day = versionDayKey();
    expect(ops).toEqual([
      ['update', 'tierLists/t1', { ...board, updatedAt: 'now' }],
      ['set', `tierLists/t1/versions/${day}`, { ...board, savedAt: 'now' }],
      ['commit'],
    ]);
  });

  it('lists named versions first, then days, newest first', async () => {
    versionDocs.push(
      { id: '2026-09-01', data: () => ({}) },
      { id: 'n1', data: () => ({ label: 'Preseason', day: '2026-08-30' }) },
      { id: '2026-10-03', data: () => ({}) },
      { id: 'n2', data: () => ({ label: 'Week 4', day: '2026-09-29' }) },
      { id: '2026-09-15', data: () => ({}) }
    );
    const versions = await fetchTierListVersions('t1');
    expect(versions.map((v) => v.id)).toEqual([
      'n2',
      'n1',
      '2026-10-03',
      '2026-09-15',
      '2026-09-01',
    ]);
  });

  it('saves a named version as its own document that later saves leave alone', async () => {
    const board = { tiers: { S: ['a'], Pool: [] }, tierOrder: ['S', 'Pool'] };
    const id = await saveNamedTierListVersion('t1', board, 'Preseason');
    expect(id).toBe('named1');
    expect(ops).toEqual([
      [
        'add',
        'tierLists/t1/versions',
        { label: 'Preseason', day: versionDayKey(), ...board, savedAt: 'now' },
      ],
    ]);
  });

  it('deletes a tier list’s versions along with it', async () => {
    versionDocs.push({ id: '2026-09-01', ref: 'v1', data: () => ({}) });
    await deleteTierList('t1');
    expect(ops).toEqual([
      ['delete', 'v1'],
      ['delete', 'tierLists/t1'],
    ]);
  });
});

describe('version days', () => {
  it('keys by local calendar day', () => {
    expect(versionDayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('formats a day key for display', () => {
    expect(formatVersionDay('2026-10-03')).toBe('Oct 3, 2026');
    expect(formatVersionDay('bad')).toBe('bad');
  });
});

describe('version titles', () => {
  it('marks named versions so they read apart from daily ones', () => {
    expect(versionTitle({ id: '2026-10-03' })).toBe('Oct 3, 2026');
    expect(
      versionTitle({ id: 'x', label: 'Preseason', day: '2026-09-01' })
    ).toBe('📌 Preseason · Sep 1, 2026');
  });

  it('orders two named versions from the same day by save time', () => {
    const sorted = sortTierListVersions([
      { id: 'a', label: 'Early', day: '2026-10-03', savedAt: 1 },
      { id: 'b', label: 'Late', day: '2026-10-03', savedAt: 2 },
    ]);
    expect(sorted.map((v) => v.id)).toEqual(['b', 'a']);
  });
});
