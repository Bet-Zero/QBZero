/**
 * When a ranking document was written.
 *
 * Every write used to store two stamps: a Firestore `serverTimestamp()` and a
 * client `new Date().toISOString()`. Different pages read different ones, so
 * the archive list sorted by one field and displayed another -- and the
 * displayed one was whatever the editing machine's clock said. New writes store
 * the server stamp only; `timestamp` is read here purely so documents written
 * before that change still show a date.
 */
export const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * The most meaningful stamp on a ranking or snapshot document.
 *
 * `savedAt` is when a personal board's order was last saved, and an archive
 * carries the `savedAt` of the board it holds. Without it an archive fell back
 * to `createdAt` -- the moment it was *replaced* -- so each one was listed
 * under the date of the save after it.
 */
export const rankingDate = (record) =>
  toDate(record?.savedAt) ||
  toDate(record?.updatedAt) ||
  toDate(record?.createdAt) ||
  toDate(record?.timestamp);

const DATE_ONLY = { year: 'numeric', month: 'short', day: 'numeric' };
const DATE_AND_TIME = { ...DATE_ONLY, hour: 'numeric', minute: '2-digit' };

const formatDate = (date, withTime) =>
  date
    ? date.toLocaleDateString('en-US', withTime ? DATE_AND_TIME : DATE_ONLY)
    : 'Unknown date';

export const formatRankingDate = (record, { withTime = false } = {}) =>
  formatDate(rankingDate(record), withTime);

/** When an archive stopped being the live board: the save that replaced it. */
export const formatReplacedDate = (archive, { withTime = false } = {}) =>
  formatDate(
    toDate(archive?.createdAt) || toDate(archive?.timestamp),
    withTime
  );

/**
 * The heading date for an archive: the day its board was saved, or -- for an
 * old archive whose save date cannot be worked out -- the day it was replaced,
 * labelled as such rather than passed off as the other.
 */
export const formatArchiveDate = (archive, options) =>
  archive?.dateIsReplacement
    ? `Replaced ${formatReplacedDate(archive, options)}`
    : formatRankingDate(archive, options);
