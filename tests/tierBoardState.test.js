import { describe, it, expect } from 'vitest';
import {
  POOL,
  DEFAULT_TIERS,
  emptyBoard,
  boardFromSaved,
  validateTierName,
  canMove,
} from '@/features/tierMaker/tierBoardState';

const toPlayer = (id) => (id === 'gone' ? null : { id, player_id: id });

describe('boardFromSaved', () => {
  it('gives a freshly created list the default tiers and a Pool', () => {
    const board = boardFromSaved({ tiers: {}, tierOrder: [] }, toPlayer);
    expect(board.tierOrder).toEqual([...DEFAULT_TIERS, POOL]);
    expect(board.tiers[POOL]).toEqual([]);
  });

  it('adds a missing Pool and keeps it last', () => {
    const board = boardFromSaved(
      { tiers: { A: ['1'], B: [] }, tierOrder: ['A', 'B'] },
      toPlayer
    );
    expect(board.tierOrder).toEqual(['A', 'B', POOL]);
    expect(board.tiers[POOL]).toEqual([]);
  });

  it('moves Pool to the end and adds tiers missing from the order', () => {
    const board = boardFromSaved(
      { tiers: { A: [], Pool: ['2'], Z: ['3'] }, tierOrder: ['Pool', 'A'] },
      toPlayer
    );
    expect(board.tierOrder).toEqual(['A', 'Z', POOL]);
    expect(board.tiers.Z).toEqual([{ id: '3', player_id: '3' }]);
  });

  it('drops order entries without a tier, duplicates, and unknown players', () => {
    const board = boardFromSaved(
      { tiers: { A: ['1', 'gone'] }, tierOrder: ['A', 'X', 'A'] },
      toPlayer
    );
    expect(board.tierOrder).toEqual(['A', POOL]);
    expect(board.tiers.A).toEqual([{ id: '1', player_id: '1' }]);
  });
});

describe('validateTierName', () => {
  const order = ['S', 'A', POOL];
  it('rejects an existing name instead of overwriting that tier', () => {
    expect(validateTierName('A', order).error).toMatch(/already exists/);
    expect(validateTierName('A', order).name).toBeNull();
  });
  it('rejects Pool in any case', () => {
    expect(validateTierName('pool', order).error).toMatch(/reserved/);
  });
  it('treats cancel, blank and unchanged as a no-op', () => {
    expect(validateTierName(null, order)).toEqual({ error: null, name: null });
    expect(validateTierName('  ', order)).toEqual({ error: null, name: null });
    expect(validateTierName('S', order, 'S')).toEqual({
      error: null,
      name: null,
    });
  });
  it('trims a valid name', () => {
    expect(validateTierName(' Elite ', order)).toEqual({
      error: null,
      name: 'Elite',
    });
  });
});

describe('canMove', () => {
  it('uses position, not the tier name', () => {
    const order = ['Elite', 'S', POOL];
    expect(canMove(order, 'Elite', 'up')).toBe(false);
    expect(canMove(order, 'S', 'up')).toBe(true);
    expect(canMove(order, POOL, 'down')).toBe(false);
  });
});

describe('emptyBoard', () => {
  it('puts the given players in the Pool', () => {
    expect(emptyBoard([{ id: '1' }]).tiers[POOL]).toEqual([{ id: '1' }]);
  });
});
