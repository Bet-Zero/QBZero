import { QB_TRAITS } from '@/constants/traits';
import { teamAbbrFor } from '@/constants/teamList';
import { QB_STATS } from '@/constants/stats';

const runningProfileRank = {
  Elite: 6,
  Plus: 5,
  Capable: 4,
  Willing: 3,
  Hesitant: 2,
  Non: 1,
};

const traitSort = QB_TRAITS;

// Stored casing varies, so match the rank table's keys before looking up.
const normalizeProfile = (profile) =>
  typeof profile === 'string'
    ? profile.charAt(0).toUpperCase() + profile.slice(1).toLowerCase()
    : profile;

export function filterPlayers(players = [], filters) {
  if (!players) return [];

  return players.filter((p) => {
    if (filters.nameSearch) {
      const playerName = (p.display_name || p.name || '').toLowerCase();
      const searchTerm = filters.nameSearch.toLowerCase();
      if (!playerName.includes(searchTerm)) return false;
    }

    // The dropdown is keyed by team id ('cardinals'); records store the
    // abbreviation ('ARI'). Comparing them directly matched nothing, ever.
    if (
      filters.team &&
      (p.bio?.Team || '').toUpperCase() !== teamAbbrFor(filters.team)
    ) {
      return false;
    }

    if (
      p.heightInInches < filters.minHeight ||
      (filters.maxHeight !== null && p.heightInInches > filters.maxHeight)
    ) {
      return false;
    }

    if (
      p.weight < filters.minWeight ||
      (filters.maxWeight !== null && p.weight > filters.maxWeight)
    ) {
      return false;
    }

    if (
      p.age < filters.minAge ||
      (filters.maxAge !== null && p.age > filters.maxAge)
    ) {
      return false;
    }

    if (filters.minSalary !== undefined || filters.maxSalary !== undefined) {
      const salary = p.salaryByYear?.[filters.salaryYear] ?? null;
      if (typeof salary !== 'number') return false;
      if (filters.minSalary !== undefined && salary < filters.minSalary)
        return false;
      if (filters.maxSalary !== undefined && salary > filters.maxSalary)
        return false;
    }

    if (
      filters.freeAgentYear &&
      parseInt(p.free_agency_year || 0) !== parseInt(filters.freeAgentYear)
    ) {
      return false;
    }

    if (filters.freeAgentType && p.free_agent_type !== filters.freeAgentType) {
      return false;
    }

    if (
      filters.offenseRole &&
      ![p.roles?.offense1, p.roles?.offense2]
        .filter(Boolean)
        .some((role) =>
          role.toLowerCase().includes(filters.offenseRole.toLowerCase())
        )
    ) {
      return false;
    }

    // Stored profiles are not consistently cased — useRosterManager lowercases
    // them, normalizePlayerData passes them through — so compare case-blind.
    if (
      filters.runningProfile &&
      (p.runningProfile || '').toLowerCase() !==
        filters.runningProfile.toLowerCase()
    ) {
      return false;
    }

    if (
      filters.subRoles?.offense?.length &&
      !filters.subRoles.offense.every((sub) => p.subRoles.offense.includes(sub))
    ) {
      return false;
    }

    // Percentages are stored either as 0-1 or as 0-100; normalize to 0-100.
    const passesStat = ({ key, field, isPercent }) => {
      const raw = parseFloat(p[field] ?? 0) || 0;
      const val = isPercent && raw <= 1 ? raw * 100 : raw;
      return val >= filters[`min_${key}`] && val <= filters[`max_${key}`];
    };

    if (!QB_STATS.every(passesStat)) {
      return false;
    }

    const passesTrait = (trait) => {
      const val = parseFloat(p.traits?.[trait] ?? 0);
      return val >= filters[`min_${trait}`] && val <= filters[`max_${trait}`];
    };

    if (!QB_TRAITS.every(passesTrait)) {
      return false;
    }

    if (
      filters.badges?.length &&
      !filters.badges.every((b) => p.badges.includes(b))
    ) {
      return false;
    }

    return true;
  });
}

export function sortPlayers(
  players = [],
  sortKey,
  sortAsc = true,
  filters = {}
) {
  const salaryYear = filters.salaryYear;
  return [...players].sort((a, b) => {
    const getValue = (player, field) => {
      if (traitSort.includes(field)) return player.traits?.[field] ?? -1;
      if (Object.hasOwn(player.system?.stats || {}, field))
        return parseFloat(player.system.stats[field]) ?? -1;
      switch (field) {
        case 'name':
          return (player.display_name || player.name || '').toLowerCase();
        case 'height':
          return player.heightInInches;
        case 'weight':
          return player.weight;
        case 'age':
          return player.age;
        case 'salary':
          return player.salaryByYear?.[salaryYear] ?? -1;
        case 'runningProfile':
          return (
            runningProfileRank[normalizeProfile(player.runningProfile)] ?? 0
          );
        case 'yearsRemaining':
          return parseInt(player.free_agency_year) - 2024 || -1;
        case 'totalContract':
          return Array.isArray(player.contract?.annual_salaries)
            ? player.contract.annual_salaries.reduce((sum, s) => {
                const val =
                  typeof s.salary === 'number'
                    ? s.salary
                    : parseFloat((s.salary || '').replace(/[^0-9.]/g, ''));
                return isNaN(val) ? sum : sum + val;
              }, 0)
            : -1;
        case 'overall':
          return parseFloat(player.overall) ?? -1;
        default:
          return -1;
      }
    };

    const valA = getValue(a, sortKey);
    const valB = getValue(b, sortKey);

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });
}
