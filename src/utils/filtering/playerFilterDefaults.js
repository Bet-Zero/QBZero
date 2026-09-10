import { QB_TRAITS } from '@/constants/traits';
import { QB_STATS } from '@/constants/stats';

const defaultStatBounds = () =>
  Object.fromEntries(
    QB_STATS.flatMap((stat) => [
      [`min_${stat.key}`, 0],
      [`max_${stat.key}`, stat.max],
    ])
  );

// filterPlayers gates on every trait, so each one needs a bound here; a
// missing pair compares against undefined and filters out every player.
const defaultTraitBounds = () =>
  Object.fromEntries(
    QB_TRAITS.flatMap((trait) => [
      [`min_${trait}`, 0],
      [`max_${trait}`, 100],
    ])
  );

export function getDefaultPlayerFilters() {
  return {
    nameSearch: '',
    nameOrder: 'az',
    sortBy: '',
    sortAsc: false,
    team: '',
    minHeight: 0,
    maxHeight: null,
    minWeight: 0,
    maxWeight: null,
    minAge: 0,
    maxAge: null,
    minSalary: undefined,
    maxSalary: undefined,
    salaryYear: 2025,
    freeAgentYear: '',
    freeAgentType: '',
    birdRights: '',
    offenseRole: '',
    runningProfile: '',
    subRoles: { offense: [] },
    ...defaultStatBounds(),
    ...defaultTraitBounds(),
    badges: [],
  };
}
