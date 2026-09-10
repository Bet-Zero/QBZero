import { describe, it, expect } from 'vitest';
import {
  filterPlayers,
  sortPlayers,
} from '@/utils/filtering/playerFilterUtils';
import { getDefaultPlayerFilters } from '@/utils/filtering/playerFilterDefaults';
import { QB_TRAITS, emptyTraits } from '@/constants/traits';
import { QB_STATS } from '@/constants/stats';
import { statOptions } from '@/utils/filtering/statFilters';
import { TeamListFull } from '@/constants/teamList';

const qb = (overrides) => ({
  display_name: 'Test QB',
  bio: { Team: 'KC', Position: 'QB' },
  age: 25,
  heightInInches: 74,
  weight: 220,
  roles: { offense1: 'Gunslinger' },
  subRoles: { offense: [] },
  traits: emptyTraits(),
  badges: [],
  ...overrides,
});

describe('filterPlayers — traits', () => {
  it('keeps players when no trait filter is narrowed', () => {
    // The defaults defined bounds for the basketball traits this app was
    // forked with, while filterPlayers gated on the quarterback ones. Every
    // trait compared a real rating against undefined, so the players table
    // filtered out every player, always.
    const graded = qb({
      display_name: 'Graded',
      traits: Object.fromEntries(QB_TRAITS.map((t) => [t, 90])),
    });

    expect(
      filterPlayers([graded, qb({})], getDefaultPlayerFilters())
    ).toHaveLength(2);
  });

  it('defines a bound for every trait it gates on', () => {
    const filters = getDefaultPlayerFilters();
    QB_TRAITS.forEach((trait) => {
      expect(filters[`min_${trait}`]).toBeTypeOf('number');
      expect(filters[`max_${trait}`]).toBeTypeOf('number');
    });
  });

  it('still narrows on a raised trait floor', () => {
    const strong = qb({ display_name: 'Strong', traits: { Throwing: 95 } });
    const weak = qb({ display_name: 'Weak', traits: { Throwing: 40 } });

    const matched = filterPlayers([strong, weak], {
      ...getDefaultPlayerFilters(),
      min_Throwing: 80,
    }).map((p) => p.display_name);

    expect(matched).toEqual(['Strong']);
  });
});

describe('filterPlayers — running profile', () => {
  it('matches regardless of stored casing', () => {
    // useRosterManager lowercases runningProfile while normalizePlayerData
    // passes it through, so an exact-match compare silently returned nothing
    // for whichever side disagreed with the capitalized filter value.
    const players = [
      qb({ display_name: 'Upper', runningProfile: 'Elite' }),
      qb({ display_name: 'Lower', runningProfile: 'elite' }),
      qb({ display_name: 'Other', runningProfile: 'Hesitant' }),
    ];

    const matched = filterPlayers(players, {
      ...getDefaultPlayerFilters(),
      runningProfile: 'Elite',
    }).map((p) => p.display_name);

    expect(matched).toEqual(['Upper', 'Lower']);
  });

  it('ignores players with no running profile recorded', () => {
    const players = [qb({ runningProfile: '—' }), qb({})];

    expect(
      filterPlayers(players, {
        ...getDefaultPlayerFilters(),
        runningProfile: 'Plus',
      })
    ).toEqual([]);
  });

  it('returns everyone when no profile is selected', () => {
    const players = [qb({ runningProfile: 'Elite' }), qb({})];

    expect(filterPlayers(players, getDefaultPlayerFilters())).toHaveLength(2);
  });

  it('sorts by profile rank regardless of stored casing', () => {
    const players = [
      qb({ display_name: 'Hesitant', runningProfile: 'hesitant' }),
      qb({ display_name: 'Elite', runningProfile: 'Elite' }),
      qb({ display_name: 'Capable', runningProfile: 'CAPABLE' }),
    ];

    const order = sortPlayers(players, 'runningProfile', false).map(
      (p) => p.display_name
    );

    expect(order).toEqual(['Elite', 'Capable', 'Hesitant']);
  });
});

describe('filterPlayers — stats', () => {
  it('keeps players when no stat filter is narrowed', () => {
    const starter = qb({
      display_name: 'Starter',
      CMP: 401,
      ATT: 597,
      YDS: 4183,
      TD: 27,
      INT: 14,
      'CMP%': 67.2,
      RTG: 93.5,
      QBR: 62.1,
    });

    expect(
      filterPlayers([starter, qb({})], getDefaultPlayerFilters())
    ).toHaveLength(2);
  });

  it('narrows on a quarterback stat', () => {
    // The filters gated on PTS/TRB/AST, which no quarterback carries, so any
    // stat floor compared 0 against it and emptied the table.
    const busy = qb({ display_name: 'Busy', YDS: 4183 });
    const quiet = qb({ display_name: 'Quiet', YDS: 900 });

    const matched = filterPlayers([busy, quiet], {
      ...getDefaultPlayerFilters(),
      min_YDS: 3000,
    }).map((p) => p.display_name);

    expect(matched).toEqual(['Busy']);
  });

  it('reads completion percentage stored either way', () => {
    const asFraction = qb({ display_name: 'Fraction', 'CMP%': 0.672 });
    const asPercent = qb({ display_name: 'Percent', 'CMP%': 67.2 });

    const matched = filterPlayers([asFraction, asPercent], {
      ...getDefaultPlayerFilters(),
      min_CMPP: 65,
    }).map((p) => p.display_name);

    expect(matched).toEqual(['Fraction', 'Percent']);
  });

  it('defines a bound for every stat it gates on', () => {
    const filters = getDefaultPlayerFilters();
    QB_STATS.forEach((stat) => {
      expect(filters[`min_${stat.key}`]).toBeTypeOf('number');
      expect(filters[`max_${stat.key}`]).toBeTypeOf('number');
    });
  });

  it('offers only quarterback stats in the filter UI', () => {
    expect(statOptions.map((s) => s.label)).toEqual([
      'CMP',
      'ATT',
      'YDS',
      'TD',
      'INT',
      'CMP%',
      'RTG',
      'QBR',
    ]);
  });
});

describe('filterPlayers — team', () => {
  it('matches the dropdown id against the stored abbreviation', () => {
    // The dropdown emits TeamListFull ids ('cardinals') while records store
    // bio.Team as an abbreviation ('ARI'), so every team yielded no results.
    const players = [
      qb({ display_name: 'Cardinal', bio: { Team: 'ARI' } }),
      qb({ display_name: 'Chief', bio: { Team: 'KC' } }),
    ];

    const matched = filterPlayers(players, {
      ...getDefaultPlayerFilters(),
      team: 'cardinals',
    }).map((p) => p.display_name);

    expect(matched).toEqual(['Cardinal']);
  });

  it('accepts an abbreviation directly too', () => {
    const players = [qb({ display_name: 'Chief', bio: { Team: 'KC' } })];

    expect(
      filterPlayers(players, { ...getDefaultPlayerFilters(), team: 'KC' })
    ).toHaveLength(1);
  });

  it('gives every team an abbreviation', () => {
    expect(TeamListFull).toHaveLength(32);
    TeamListFull.forEach((team) => {
      expect(team.abbr, `${team.id} has no abbr`).toMatch(/^[A-Z]{2,3}$/);
    });
  });
});
