import { rankingDate } from '@/utils/formatting/rankingDates';

const nameKey = (qb) =>
  (qb?.name || qb?.display_name || '').trim().toLowerCase();

/**
 * Where one quarterback stood on each board, oldest first.
 *
 * Found by id, then by name -- boards saved before entries kept their roster id
 * carried a generated one, and the same quarterback should still read as one
 * line across that change. A board he was not on gives `rank: null`, so a gap
 * shows as a gap rather than being skipped.
 *
 * @param {Array} boards - history entries, newest first, each with `rankings`
 * @param {{ id: string, name?: string }} qb
 * @returns {Array<{ id: string, date: Date|null, rank: number|null, size: number }>}
 */
export const rankHistoryFor = (boards = [], qb) => {
  const key = nameKey(qb);

  return [...boards].reverse().map((board) => {
    const entries = board.rankings || [];
    let index = entries.findIndex((entry) => entry.id === qb.id);
    if (index < 0 && key) {
      index = entries.findIndex((entry) => nameKey(entry) === key);
    }
    return {
      id: board.id,
      date: rankingDate(board),
      rank: index >= 0 ? index + 1 : null,
      size: entries.length,
    };
  });
};

/** Best and worst rank across a history, ignoring the boards he was off. */
export const rankRange = (points = []) => {
  const ranks = points.map((point) => point.rank).filter(Boolean);
  if (!ranks.length) return null;
  return { best: Math.min(...ranks), worst: Math.max(...ranks) };
};
