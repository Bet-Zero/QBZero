import { describe, it, expect } from 'vitest';
import {
  POOL,
  DEFAULT_TIERS,
  addTier,
  addToPool,
  boardFromSaved,
  boardSignature,
  boardToSaved,
  createEmptyBoard,
  deleteTier,
  renameTier,
  toBoardPlayer,
} from '@/utils/tierMaker/tierBoard';

const players = {
  p1: { id: 'p1', display_name: 'Patrick Mahomes', bio: { Team: 'KC' } },
  p2: { id: 'p2', display_name: 'Josh Allen', bio: { Team: 'BUF' } },
  p3: { id: 'p3', display_name: 'Joe Burrow', bio: { Team: 'CIN' } },
};

const ids = (list) => list.map((p) => p.player_id);

describe('boardFromSaved', () => {
  it('gives a brand-new (empty) tier list the default tiers and a pool', () => {
    const board = boardFromSaved({ tiers: {}, tierOrder: [] }, players);
    expect(board.tierOrder).toEqual([...DEFAULT_TIERS, POOL]);
    expect(board.tiers[POOL]).toEqual([]);
  });

  it('keeps the pool last and adds tiers missing from tierOrder', () => {
    const board = boardFromSaved(
      {
        tiers: { Pool: ['p3'], S: ['p1'], Extra: ['p2'] },
        tierOrder: [POOL, 'S'],
      },
      players
    );
    expect(board.tierOrder).toEqual(['S', 'Extra', POOL]);
    expect(ids(board.tiers.Extra)).toEqual(['p2']);
    expect(ids(board.tiers[POOL])).toEqual(['p3']);
  });

  it('adds a pool when old data has none', () => {
    const board = boardFromSaved(
      { tiers: { S: ['p1'] }, tierOrder: ['S'] },
      players
    );
    expect(board.tierOrder).toEqual(['S', POOL]);
    expect(board.tiers[POOL]).toEqual([]);
  });

  it('keeps only the first placement of a duplicated player', () => {
    const board = boardFromSaved(
      { tiers: { S: ['p1'], A: ['p1', 'p2'] }, tierOrder: ['S', 'A'] },
      players
    );
    expect(ids(board.tiers.S)).toEqual(['p1']);
    expect(ids(board.tiers.A)).toEqual(['p2']);
  });

  it('keeps unknown ids through a load/save round trip', () => {
    const saved = {
      tiers: { S: ['p1', 'gone'], A: [], Pool: [] },
      tierOrder: ['S', 'A', POOL],
    };
    const board = boardFromSaved(saved, players);
    expect(ids(board.tiers.S)).toEqual(['p1']);
    expect(board.unresolved).toEqual({ S: ['gone'] });
    expect(boardToSaved(board)).toEqual(saved);
  });

  it('moves unknown ids to the pool when their tier is deleted', () => {
    const board = boardFromSaved(
      { tiers: { S: ['gone'], Pool: [] }, tierOrder: ['S', POOL] },
      players
    );
    const after = deleteTier(board, 'S');
    expect(boardToSaved(after).tiers).toEqual({ Pool: ['gone'] });
  });
});

describe('tier names', () => {
  const loaded = () =>
    boardFromSaved(
      { tiers: { S: ['p1'], A: ['p2'], Pool: [] }, tierOrder: ['S', 'A'] },
      players
    );

  it('refuses to add a tier that already exists instead of emptying it', () => {
    const { error, board } = addTier(loaded(), 'S');
    expect(error).toMatch(/already/);
    expect(board).toBeUndefined();
  });

  it('refuses a tier called Pool, in any case', () => {
    expect(addTier(loaded(), 'pool').error).toBeTruthy();
    expect(renameTier(loaded(), 'A', 'Pool').error).toBeTruthy();
  });

  it('trims names and rejects blank ones', () => {
    expect(addTier(loaded(), '   ').error).toBeTruthy();
    const { board } = addTier(loaded(), '  Elite ');
    expect(board.tierOrder).toEqual(['S', 'A', 'Elite', POOL]);
  });

  it('refuses to rename onto an existing tier instead of overwriting it', () => {
    const { error } = renameTier(loaded(), 'A', 'S');
    expect(error).toMatch(/already/);
  });

  it('renames in place, keeping players and position', () => {
    const { board } = renameTier(loaded(), 'S', 'Elite');
    expect(board.tierOrder).toEqual(['Elite', 'A', POOL]);
    expect(ids(board.tiers.Elite)).toEqual(['p1']);
    expect(board.tiers.S).toBeUndefined();
  });

  it('deleting a tier sends its players to the pool', () => {
    const board = deleteTier(loaded(), 'S');
    expect(board.tierOrder).toEqual(['A', POOL]);
    expect(ids(board.tiers[POOL])).toEqual(['p1']);
  });
});

describe('players', () => {
  it('uses the full player record for drawer rows', () => {
    const drawerRow = {
      id: 'p1',
      name: 'patrick mahomes',
      original: players.p1,
    };
    const tile = toBoardPlayer(drawerRow);
    expect(tile.bio.Team).toBe('KC');
    expect(tile.display_name).toBe('Patrick Mahomes');
    expect(tile.player_id).toBe('p1');
  });

  it('does not add a player who is already on the board', () => {
    const board = boardFromSaved(
      { tiers: { S: ['p1'], Pool: [] }, tierOrder: ['S'] },
      players
    );
    const after = addToPool(board, [players.p1, players.p2, players.p2]);
    expect(ids(after.tiers[POOL])).toEqual(['p2']);
  });
});

describe('boardSignature', () => {
  it('changes when the board changes and not otherwise', () => {
    const a = createEmptyBoard();
    const b = addToPool(a, [players.p1]);
    expect(boardSignature(a)).toBe(boardSignature(createEmptyBoard()));
    expect(boardSignature(a)).not.toBe(boardSignature(b));
  });
});
