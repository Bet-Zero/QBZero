// Whether a quarterback is still playing.
//
// Retirement never removes anyone from the curated list in
// `src/features/ranker/quarterbacks.js` — the point of keeping them is that a
// past season should still be rankable with the quarterbacks who played it.
// This field is what keeps them out of the ranker's default pool instead.
//
// Set from `status: RETIRED` on the curated list entry and applied by
// populateQBs — that's the normal path, since retirement is public record by
// the time anyone would set it. The toggle on the profile page writes the
// same field directly for anything not yet reflected in the list.
export const ACTIVE = 'active';
export const RETIRED = 'retired';

export const PLAYER_STATUSES = [
  { value: ACTIVE, label: 'Active' },
  { value: RETIRED, label: 'Retired' },
];

export const isActive = (status) => (status || ACTIVE) === ACTIVE;
