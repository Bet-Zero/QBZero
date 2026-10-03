import { describe, it, expect } from 'vitest';
import { POOL, movePlayerTo, reorderTiers } from '@/utils/tierMaker/tierBoard';

describe('movePlayerTo', () => {
  const p = (id) => ({ id, player_id: id });
  const tiers = { S: [p('1'), p('2')], A: [p('3')], [POOL]: [] };

  it('moves across tiers at an index', () => {
    const next = movePlayerTo(tiers, '3', 'S', 1);
    expect(next.S.map((x) => x.id)).toEqual(['1', '3', '2']);
    expect(next.A).toEqual([]);
  });

  it('appends when no index is given', () => {
    expect(movePlayerTo(tiers, '1', POOL)[POOL].map((x) => x.id)).toEqual([
      '1',
    ]);
  });

  it('reorders within a tier', () => {
    expect(movePlayerTo(tiers, '1', 'S', 1).S.map((x) => x.id)).toEqual([
      '2',
      '1',
    ]);
  });

  it('returns the same object for a no-op or unknown target', () => {
    expect(movePlayerTo(tiers, '1', 'S', 0)).toBe(tiers);
    expect(movePlayerTo(tiers, '1', 'Nope', 0)).toBe(tiers);
    expect(movePlayerTo(tiers, 'x', 'S', 0)).toBe(tiers);
  });
});

describe('reorderTiers', () => {
  it('moves a tier and keeps Pool last', () => {
    expect(reorderTiers(['S', 'A', 'B', POOL], 'B', 'S')).toEqual([
      'B',
      'S',
      'A',
      POOL,
    ]);
  });
  it('ignores Pool and unknown tiers', () => {
    const order = ['S', 'A', POOL];
    expect(reorderTiers(order, POOL, 'S')).toBe(order);
    expect(reorderTiers(order, 'S', POOL)).toBe(order);
  });
});
