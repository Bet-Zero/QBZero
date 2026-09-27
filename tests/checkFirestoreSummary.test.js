// The player-data summary decides an open question about the live project --
// whether anything fills bio, stats and contract, since nothing tracked in this
// repository does. A miscount would be reported as fact about real data, and
// the script around it cannot run without a credential, so the counting is
// pulled out and checked here.
import { describe, it, expect } from 'vitest';
import { summarizePlayerDocs } from '../scripts/checkFirestore.js';
import { RETIRED } from '@/constants/playerStatus';

const empty = () => ({
  bio: { AGE: null, HT: null, WT: null, 'Years Pro': null, Team: 'KC' },
  system: { stats: {} },
  contract: {},
  traits: {},
  overall_grade: null,
  status: 'active',
});

describe('summarizePlayerDocs', () => {
  it('counts a freshly populated roster as having nothing filled in', () => {
    // What populateQBs writes: identity only, every evaluation field empty.
    const summary = summarizePlayerDocs([empty(), empty(), empty()]);
    expect(summary).toEqual({
      total: 3,
      retired: 0,
      withStats: 0,
      withBio: 0,
      withContract: 0,
      graded: 0,
      withOverall: 0,
    });
  });

  it('counts each kind of filled-in field', () => {
    const summary = summarizePlayerDocs([
      { ...empty(), system: { stats: { YDS: 4200 } } },
      { ...empty(), bio: { ...empty().bio, AGE: 29 } },
      { ...empty(), contract: { years: 4 } },
      { ...empty(), traits: { Throwing: 82 } },
      { ...empty(), overall_grade: 77 },
      { ...empty(), status: RETIRED },
    ]);
    expect(summary).toMatchObject({
      total: 6,
      retired: 1,
      withStats: 1,
      withBio: 1,
      withContract: 1,
      graded: 1,
      withOverall: 1,
    });
  });

  // A zero is a real stat, and a graded 0 is a real grade. Treating either as
  // absent would under-report and make an ingestion path look broken.
  it('treats zero as a filled-in value, not an empty one', () => {
    const summary = summarizePlayerDocs([
      { ...empty(), system: { stats: { INT: 0 } } },
      { ...empty(), traits: { Durability: 0 } },
      { ...empty(), overall_grade: 0 },
    ]);
    expect(summary).toMatchObject({
      withStats: 1,
      graded: 1,
      withOverall: 1,
    });
  });

  it('survives documents missing the fields entirely', () => {
    const summary = summarizePlayerDocs([{}, { bio: {} }, { system: {} }]);
    expect(summary).toMatchObject({ total: 3, withStats: 0, withBio: 0 });
  });

  it('reports nothing for an empty collection', () => {
    expect(summarizePlayerDocs([])).toMatchObject({ total: 0, withStats: 0 });
    expect(summarizePlayerDocs()).toMatchObject({ total: 0 });
  });
});
