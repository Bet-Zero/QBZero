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

const toMillis = (date) => (date ? date.getTime() : 0);

/**
 * Every version of one quarterback's note, newest first.
 *
 * Two sources. The note log records each edit as it happens, with its own
 * time, but only from when it was added. Before that, the boards themselves are
 * the record: each version carries the note he had when it was saved, dated by
 * that version. Both are merged into one timeline and a note that did not
 * change between one entry and the next is shown once -- the logged copy, when
 * there is one, because its date is when it was actually written.
 *
 * @param {Array} boards - history entries, newest first, each with `rankings`
 * @param {{ id: string, name?: string }} qb
 * @param {Array} logged - note log documents, `{ notes, at }`
 * @returns {Array<{ notes: string, date: Date|null, source: 'log'|'board' }>}
 */
export const noteHistoryFor = (boards = [], qb, logged = []) => {
  const fromBoards = rankHistoryFor(boards, qb)
    .map((point, index) => {
      if (!point.rank) return null;
      const board = [...boards].reverse()[index];
      const entry = board.rankings[point.rank - 1];
      return { notes: entry?.notes || '', date: point.date, source: 'board' };
    })
    .filter(Boolean);

  const fromLog = logged.map((item) => ({
    notes: item.notes || '',
    date: typeof item.at?.toDate === 'function' ? item.at.toDate() : null,
    source: 'log',
  }));

  const timeline = [...fromBoards, ...fromLog].sort(
    (a, b) =>
      toMillis(a.date) - toMillis(b.date) ||
      // On a tie the logged copy goes second, so it wins the merge below.
      (a.source === 'log') - (b.source === 'log')
  );

  const merged = [];
  timeline.forEach((item) => {
    const last = merged[merged.length - 1];
    if (last && last.notes === item.notes) {
      if (item.source === 'log' && last.source !== 'log') {
        merged[merged.length - 1] = item;
      }
      return;
    }
    merged.push(item);
  });

  // A note that starts out empty is not worth a line; a note later cleared is.
  while (merged.length && !merged[0].notes) merged.shift();
  return merged.reverse();
};
