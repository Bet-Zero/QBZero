import { describe, it, expect } from 'vitest';
import {
  uniqueTierLabels,
  listToTierBoard,
  tierBoardToList,
  keepNotesFor,
} from '@/utils/lists/listTierBridge';

describe('uniqueTierLabels', () => {
  it('numbers repeated labels instead of merging them', () => {
    expect(uniqueTierLabels(['New Tier', 'New Tier', 'New Tier'])).toEqual([
      'New Tier',
      'New Tier 2',
      'New Tier 3',
    ]);
  });

  it('replaces labels Firestore or the board cannot use as keys', () => {
    expect(uniqueTierLabels(['', '  ', '__name__', 'Pool', 'Elite'])).toEqual([
      'Tier 1',
      'Tier 2',
      'Tier 3',
      'Tier 4',
      'Elite',
    ]);
  });
});

describe('listToTierBoard', () => {
  it('keeps a tiered list in its tiers and order', () => {
    expect(
      listToTierBoard({
        playerOrder: ['divider::Elite', 'a', 'b', 'divider::Good', 'c'],
      })
    ).toEqual({
      tiers: { Elite: ['a', 'b'], Good: ['c'], Pool: [] },
      tierOrder: ['Elite', 'Good', 'Pool'],
    });
  });

  it('labels players above the first divider the way the list page does', () => {
    const board = listToTierBoard({
      playerOrder: ['a', 'divider::Next', 'b'],
    });
    expect(board.tierOrder).toEqual(['Tier 1', 'Next', 'Pool']);
    expect(board.tiers['Tier 1']).toEqual(['a']);
  });

  it('keeps every player when two dividers share the default label', () => {
    const board = listToTierBoard({
      playerOrder: ['divider::New Tier', 'a', 'divider::New Tier', 'b'],
    });
    expect(board.tiers).toEqual({
      'New Tier': ['a'],
      'New Tier 2': ['b'],
      Pool: [],
    });
  });

  it('puts an untiered list in the Pool under the default tiers', () => {
    expect(listToTierBoard({ playerIds: ['a', 'b'] })).toEqual({
      tiers: { S: [], A: [], B: [], C: [], D: [], Pool: ['a', 'b'] },
      tierOrder: ['S', 'A', 'B', 'C', 'D', 'Pool'],
    });
  });
});

describe('tierBoardToList', () => {
  it('writes tiers as dividers, empty tiers included', () => {
    expect(
      tierBoardToList({
        tiers: { S: ['a'], A: [], B: ['b', 'c'], Pool: [] },
        tierOrder: ['S', 'A', 'B', 'Pool'],
      })
    ).toEqual({
      playerOrder: ['divider::S', 'a', 'divider::A', 'divider::B', 'b', 'c'],
      playerIds: ['a', 'b', 'c'],
    });
  });

  it('keeps Pool players under an Unplaced tier instead of dropping them', () => {
    const { playerOrder } = tierBoardToList({
      tiers: { S: ['a'], Pool: ['b'] },
      tierOrder: ['S', 'Pool'],
    });
    expect(playerOrder).toEqual(['divider::S', 'a', 'divider::Unplaced', 'b']);
  });

  it('includes tiers missing from tierOrder and lists a player once', () => {
    const { playerOrder } = tierBoardToList({
      tiers: { S: ['a'], Extra: ['a', 'b'] },
      tierOrder: ['S'],
    });
    expect(playerOrder).toEqual(['divider::S', 'a', 'divider::Extra', 'b']);
  });

  it('round-trips a tiered list unchanged', () => {
    const list = {
      playerOrder: [
        'divider::Elite',
        'a',
        'b',
        'divider::Good',
        'divider::Ok',
        'c',
      ],
    };
    expect(tierBoardToList(listToTierBoard(list)).playerOrder).toEqual(
      list.playerOrder
    );
  });

  it('round-trips a board unchanged', () => {
    const board = {
      tiers: { S: ['a'], A: ['b', 'c'], B: [], Pool: [] },
      tierOrder: ['S', 'A', 'B', 'Pool'],
    };
    expect(listToTierBoard(tierBoardToList(board))).toEqual(board);
  });
});

describe('keepNotesFor', () => {
  it('drops notes for players no longer on the list', () => {
    expect(keepNotesFor({ a: 'x', b: 'y' }, ['a'])).toEqual({ a: 'x' });
  });
});
