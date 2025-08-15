// src/utils/contracts/getCurrentSeasonYear.js

export function getCurrentSeasonYear(date = new Date()) {
  // Use UTC methods so logic is timezone agnostic
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0 = Jan … 6 = Jul … 11 = Dec
  const day = date.getUTCDate();

  // NFL league year starts mid-March.
  // • March 14 or earlier → previous season
  // • March 15 or later   → current season
  const isNewSeason = month > 2 || (month === 2 && day >= 15);
  return isNewSeason ? year : year - 1;
}
