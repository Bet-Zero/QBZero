// The default pool is a hand-edited list like quarterbacks.js, and goes wrong
// the same quiet ways: a typo'd id is simply missing from the ranker, and a
// pool that is not a multiple of six leaves a ragged last row on the export.
import { describe, it, expect } from 'vitest';
import { quarterbacks } from '@/features/ranker/quarterbacks';
import {
  DEFAULT_POOL_STARTERS,
  DEFAULT_POOL_BACKUPS,
  DEFAULT_POOL_IDS,
} from '@/features/ranker/defaultPool';
import { TEAM_LOGO_MAP } from '@/utils/formatting/teamLogos';
import { RETIRED } from '@/constants/playerStatus';

const VALID_TEAMS = Object.keys(TEAM_LOGO_MAP).filter((key) =>
  /^[A-Z]{2,3}$/.test(key)
);
const byId = new Map(quarterbacks.map((qb) => [qb.id, qb]));

describe('the default ranker pool', () => {
  it('names a starter for every team, and only real teams', () => {
    expect(Object.keys(DEFAULT_POOL_STARTERS).sort()).toEqual(
      [...VALID_TEAMS].sort()
    );
  });

  it('only names quarterbacks on the curated roster', () => {
    expect(DEFAULT_POOL_IDS.filter((id) => !byId.has(id))).toEqual([]);
  });

  it('lists nobody twice', () => {
    expect(DEFAULT_POOL_IDS).toHaveLength(new Set(DEFAULT_POOL_IDS).size);
  });

  it('files each starter under the team the roster has them on', () => {
    const misfiled = Object.entries(DEFAULT_POOL_STARTERS).filter(
      ([team, id]) => byId.get(id)?.team !== team
    );
    expect(misfiled).toEqual([]);
  });

  it('leaves out quarterbacks the roster marks retired', () => {
    expect(
      DEFAULT_POOL_IDS.filter((id) => byId.get(id)?.status === RETIRED)
    ).toEqual([]);
  });

  it('fills whole rows of six on the export', () => {
    expect(DEFAULT_POOL_IDS.length % 6).toBe(0);
    expect(DEFAULT_POOL_BACKUPS.length).toBeGreaterThan(0);
  });
});
