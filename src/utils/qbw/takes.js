// Pure helpers for the QB Weekly take board.

export const TAKE_STATUSES = ['pending', 'correct', 'wrong'];

// The fields a take is made of. Anything else on a take object (id,
// timestamps, author) is managed by takeHelpers, never by the form.
export const TAKE_FIELDS = [
  'title',
  'description',
  'qbName',
  'date',
  'proofDate',
  'status',
];

export const pickTakeFields = (take = {}) =>
  Object.fromEntries(
    TAKE_FIELDS.map((key) => [key, (take[key] ?? '').toString()])
  );

export const emptyTake = () => ({
  title: '',
  description: '',
  qbName: '',
  date: new Date().toLocaleDateString(),
  proofDate: '',
  status: 'pending',
});

/**
 * Headline numbers for the page. Accuracy is correct over resolved (correct
 * plus wrong), and null when nothing has resolved yet -- 0/0 is not 0%.
 */
export const takeStats = (takes = []) => {
  const counts = { pending: 0, correct: 0, wrong: 0 };
  for (const take of takes) {
    if (take.status in counts) counts[take.status] += 1;
  }
  const resolved = counts.correct + counts.wrong;
  return {
    total: takes.length,
    ...counts,
    accuracy: resolved ? Math.round((counts.correct / resolved) * 100) : null,
  };
};

export const filterTakes = (
  takes,
  { status = 'all', search = '', authorId = null } = {}
) => {
  const needle = search.trim().toLowerCase();
  return takes.filter((take) => {
    if (status !== 'all' && take.status !== status) return false;
    if (authorId && take.authorId !== authorId) return false;
    if (needle && !(take.qbName || '').toLowerCase().includes(needle))
      return false;
    return true;
  });
};
