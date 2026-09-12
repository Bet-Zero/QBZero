// The curated roster is plain data with no runtime validation, and every way it
// can be wrong is silent: a duplicate id makes one quarterback overwrite
// another in Firestore, a typo'd team abbreviation falls back to a default
// logo, and removing an entry orphans that quarterback's grades and drops them
// out of every past ranking. `npm run check-roster` reports all of this, but a
// warning nobody runs is not a guardrail — these are the invariants that must
// break the build.
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { quarterbacks } from '@/features/ranker/quarterbacks';
import { TEAM_LOGO_MAP } from '@/utils/formatting/teamLogos';

const headshotDir = path.resolve(__dirname, '../public/assets/headshots');

const VALID_TEAMS = Object.keys(TEAM_LOGO_MAP).filter((key) =>
  /^[A-Z]{2,3}$/.test(key)
);

describe('the curated quarterback roster', () => {
  it('has no duplicate ids', () => {
    const ids = quarterbacks.map((qb) => qb.id);
    expect(ids).toHaveLength(new Set(ids).size);
  });

  it('gives every entry an id, a name and a known team abbreviation', () => {
    const bad = quarterbacks.filter(
      (qb) => !qb.id || !qb.name || !VALID_TEAMS.includes(qb.team)
    );
    expect(bad).toEqual([]);
  });

  it('covers all 32 teams', () => {
    const covered = new Set(quarterbacks.map((qb) => qb.team));
    expect(VALID_TEAMS.filter((team) => !covered.has(team))).toEqual([]);
  });

  // A headshot on disk is proof the quarterback was once carried, so an
  // orphaned one means an entry was deleted rather than retired — which is how
  // Jake Haener's grades stopped being reachable without anything failing.
  it('still carries every quarterback that has a headshot on disk', () => {
    const ids = new Set(quarterbacks.map((qb) => qb.id));
    const orphans = fs
      .readdirSync(headshotDir)
      .filter((file) => file.endsWith('.png'))
      .map((file) => file.replace(/\.png$/, ''))
      .filter((id) => id !== 'default' && !ids.has(id));
    expect(orphans).toEqual([]);
  });
});
