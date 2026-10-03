import { rankingDate } from '@/utils/formatting/rankingDates';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const UNDATED = 'undated';

/** `2026-09`, the key a version files under; `undated` when it has no date. */
export const monthKey = (entry) => {
  const date = rankingDate(entry);
  if (!date) return UNDATED;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Versions filed by month, newest first, keeping the order they came in.
 * A version files under the month it became your ranking.
 *
 * @param {Array} entries - newest first
 * @returns {Array<{ key, year, month, label, entries }>}
 */
export const groupByMonth = (entries = []) => {
  const groups = [];
  const byKey = new Map();
  entries.forEach((entry) => {
    const key = monthKey(entry);
    let group = byKey.get(key);
    if (!group) {
      const date = rankingDate(entry);
      group = {
        key,
        year: date ? date.getFullYear() : null,
        month: date ? date.getMonth() : null,
        label: date
          ? `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
          : 'Date unknown',
        entries: [],
      };
      byKey.set(key, group);
      groups.push(group);
    }
    group.entries.push(entry);
  });
  return groups;
};

/**
 * Months filed by year, newest first. Each year also carries a count per
 * calendar month, for the twelve-cell strip on its card.
 *
 * @returns {Array<{ key, year, label, months, counts: number[], total }>}
 */
export const groupByYear = (entries = []) => {
  const years = [];
  const byYear = new Map();
  groupByMonth(entries).forEach((month) => {
    const key = month.year == null ? UNDATED : String(month.year);
    let year = byYear.get(key);
    if (!year) {
      year = {
        key,
        year: month.year,
        label: month.year == null ? 'Date unknown' : String(month.year),
        months: [],
        counts: Array(12).fill(0),
        total: 0,
      };
      byYear.set(key, year);
      years.push(year);
    }
    year.months.push(month);
    year.total += month.entries.length;
    if (month.month != null) year.counts[month.month] += month.entries.length;
  });
  return years;
};

export const MONTH_INITIALS = MONTHS.map((name) => name[0]);
export const monthName = (index) => MONTHS[index];
