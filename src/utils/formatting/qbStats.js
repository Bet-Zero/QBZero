// One formatter for a quarterback stat wherever it is shown.
//
// The profile, the table row and the table drawer each had their own, and
// they disagreed: the profile printed yards as "4200.0" and always multiplied
// completion percentage by 100 (so a stored 65.3 read 6530.0), the row printed
// every stat to one decimal, and only the drawer handled both forms of CMP%.
const RATE_STATS = new Set(['CMP%', 'RTG', 'QBR']);

/**
 * The display string for one stat, or null when there is no value.
 *
 * Counting stats are whole numbers. CMP% accepts either a fraction (0.653) or
 * a percentage (65.3) and shows the percentage; rates show one decimal.
 */
export function formatQBStat(value, key) {
  if (value === null || value === undefined || value === '') return null;
  const parsed =
    typeof value === 'number'
      ? value
      : parseFloat(String(value).replace(/[%,]/g, ''));
  if (!Number.isFinite(parsed)) return null;

  if (key === 'CMP%') {
    return (parsed <= 1 ? parsed * 100 : parsed).toFixed(1);
  }
  if (RATE_STATS.has(key)) return parsed.toFixed(1);
  return String(Math.round(parsed));
}
