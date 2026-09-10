import { QB_TRAITS } from '@/constants/traits';

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
    position: '',
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
    min_PPG: 0,
    max_PPG: 50,
    min_RPG: 0,
    max_RPG: 20,
    min_APG: 0,
    max_APG: 20,
    min_FGP: 0,
    max_FGP: 100,
    min_TPP: 0,
    max_TPP: 100,
    min_FTP: 0,
    max_FTP: 100,
    min_eFGP: 0,
    max_eFGP: 100,
    min_MIN: 0,
    max_MIN: 48,
    min_G: 0,
    max_G: 82,
    ...defaultTraitBounds(),
    badges: [],
  };
}
