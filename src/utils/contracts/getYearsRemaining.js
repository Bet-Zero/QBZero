import { getCurrentSeasonYear } from './getCurrentSeasonYear.js';

export function getYearsRemaining(
  freeAgencyYear,
  currentSeason = getCurrentSeasonYear()
) {
  if (typeof freeAgencyYear !== 'number') return 0;
  return Math.max(0, freeAgencyYear - currentSeason);
}

// New function to calculate years remaining based on actual contract salaries
export function getContractYearsRemaining(
  annualSalaries,
  currentSeason = getCurrentSeasonYear()
) {
  if (!Array.isArray(annualSalaries)) return 0;

  // Count how many contract years are remaining (including current year)
  const remainingYears = annualSalaries.filter(
    (salary) => salary.year >= currentSeason
  ).length;

  return remainingYears;
}
