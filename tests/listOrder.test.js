import { describe, it, expect } from 'vitest';
import {
  buildFlatPlayers,
  buildTiers,
  mergeListOrder,
  movePlayerFlat,
  moveItem,
  insertDivider,
  movePlayerToRank,
  playerIdsOf,
  removeItem,
} from '@/utils/lists/listOrder.js';

const roster = { a: {}, b: {}, c: {}, d: {} };

describe('mergeListOrder', () => {
  it('keeps saved order and appends members added since, once each', () => {
    expect(
      mergeListOrder({
        playerOrder: ['b', 'divider::T1', 'a'],
        playerIds: ['a', 'b', 'c', 'c'],
      })
    ).toEqual(['b', 'divider::T1', 'a', 'c']);
  });

  it('copes with a list that has never been saved from the editor', () => {
    expect(mergeListOrder({ playerIds: ['a', 'b'] })).toEqual(['a', 'b']);
    expect(mergeListOrder({})).toEqual([]);
  });
});

describe('buildTiers', () => {
  it('ranks only players that still exist, keeping the missing ones visible', () => {
    const tiers = buildTiers(['a', 'gone', 'divider::Next', 'b'], roster);
    expect(tiers).toHaveLength(2);
    expect(tiers[0].players).toEqual([
      { id: 'a', index: 0, rankIndex: 0 },
      { id: 'gone', index: 1, rankIndex: null, missing: true },
    ]);
    expect(tiers[1]).toMatchObject({ label: 'Next', headerIndex: 2 });
    expect(tiers[1].players[0]).toEqual({ id: 'b', index: 3, rankIndex: 1 });
  });
});

describe('flat view indexes', () => {
  const order = ['a', 'divider::T2', 'b', 'c'];

  it("carries each player's position in the full order", () => {
    expect(buildFlatPlayers(order, roster).map((p) => p.index)).toEqual([
      0, 2, 3,
    ]);
  });

  it('removes the player that was clicked, not whatever sat at its flat index', () => {
    // The bug: the flat view passed index 1 for "b", and removing order[1]
    // deleted the tier header instead.
    const bIndex = buildFlatPlayers(order, roster)[1].index;
    expect(removeItem(order, bIndex)).toEqual(['a', 'divider::T2', 'c']);
  });

  it('moves past a divider without moving the divider', () => {
    expect(movePlayerFlat(order, 2, -1)).toEqual([
      'b',
      'divider::T2',
      'a',
      'c',
    ]);
    expect(movePlayerFlat(order, 0, 1)).toEqual(['b', 'divider::T2', 'a', 'c']);
    expect(movePlayerFlat(order, 3, 1)).toBe(order);
  });
});

describe('moveItem / playerIdsOf', () => {
  it('swaps neighbours and ignores moves off either end', () => {
    expect(moveItem(['a', 'b'], 0, 1)).toEqual(['b', 'a']);
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });

  it('drops dividers from the membership list', () => {
    expect(playerIdsOf(['a', 'divider::x', 'b'])).toEqual(['a', 'b']);
  });
});

describe('movePlayerToRank', () => {
  const order = ['a', 'b', 'divider::T2', 'c', 'd'];

  it('lands in the tier that holds the target rank', () => {
    // a: #1 -> #3, which is c (tier 2): goes just after c.
    expect(movePlayerToRank(order, 0, 3, roster)).toEqual([
      'b',
      'divider::T2',
      'c',
      'a',
      'd',
    ]);
    // b: #2 -> #3 crosses into tier 2, after c.
    expect(movePlayerToRank(order, 1, 3, roster)).toEqual([
      'a',
      'divider::T2',
      'c',
      'b',
      'd',
    ]);
    // c: #3 -> #2 goes just before b, into tier 1.
    expect(movePlayerToRank(order, 3, 2, roster)).toEqual([
      'a',
      'c',
      'b',
      'divider::T2',
      'd',
    ]);
    expect(movePlayerToRank(order, 4, 1, roster)).toEqual([
      'd',
      'a',
      'b',
      'divider::T2',
      'c',
    ]);
  });

  it('puts a rank past the end after the last player', () => {
    expect(movePlayerToRank(order, 0, 99, roster)).toEqual([
      'b',
      'divider::T2',
      'c',
      'd',
      'a',
    ]);
  });

  it('skips players missing from the roster when counting ranks', () => {
    const withGone = ['gone', 'a', 'b'];
    expect(movePlayerToRank(withGone, 2, 1, roster)).toEqual([
      'gone',
      'b',
      'a',
    ]);
  });

  it('returns the same order when nothing moves', () => {
    expect(movePlayerToRank(order, 1, 2, roster)).toBe(order);
    expect(movePlayerToRank(order, 2, 1, roster)).toBe(order);
  });
});

describe('insertDivider', () => {
  it('inserts an unnamed break at the given position, clamped to the list', () => {
    expect(insertDivider(['a', 'b'], 1)).toEqual(['a', 'divider::', 'b']);
    expect(insertDivider(['a'], 9)).toEqual(['a', 'divider::']);
    expect(insertDivider(['a'], -1)).toEqual(['divider::', 'a']);
  });
});
