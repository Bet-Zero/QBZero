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

/** The most meaningful stamp on a ranking or snapshot document. */
export const rankingDate = (record) =>
  toDate(record?.updatedAt) ||
  toDate(record?.createdAt) ||
  toDate(record?.timestamp);

const DATE_ONLY = { year: 'numeric', month: 'short', day: 'numeric' };
const DATE_AND_TIME = { ...DATE_ONLY, hour: 'numeric', minute: '2-digit' };

export const formatRankingDate = (record, { withTime = false } = {}) => {
  const date = rankingDate(record);
  if (!date) return 'Unknown date';
  return date.toLocaleDateString('en-US', withTime ? DATE_AND_TIME : DATE_ONLY);
};
