export const defaultFilters = {
  team: '',
  position: '',
  runningProfile: '',
  badges: [],
};

export function getDefaultAddPlayerFilters() {
  return {
    team: '',
    position: '',
    runningProfile: '',
    offenseRole: '',
    defenseRole: '',
    subRoles: {
      offense: [],
      defense: [],
    },
    badges: [],
    minSalary: undefined,
    maxSalary: undefined,
    freeAgentYear: '',
    freeAgentType: '',
  };
}
