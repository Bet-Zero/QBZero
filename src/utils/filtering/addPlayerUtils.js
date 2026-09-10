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
    subRoles: {
      offense: [],
    },
    badges: [],
    minSalary: undefined,
    maxSalary: undefined,
    freeAgentYear: '',
    freeAgentType: '',
  };
}
