import { describe, it, expect } from 'vitest';
import {
  filterPlayers,
  sortPlayers,
} from '@/utils/filtering/playerFilterUtils';
import { getDefaultPlayerFilters } from '@/utils/filtering/playerFilterDefaults';
import { QB_TRAITS, emptyTraits } from '@/constants/traits';

const qb = (overrides) => ({
  display_name: 'Test QB',
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
