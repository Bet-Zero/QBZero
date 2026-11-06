// Which hand a quarterback throws with: 'R' or 'L'.
//
// A hand saved on the profile (bio.Throws) wins. Otherwise it comes from
// quarterbacks.js, where left-handed passers carry `throws: 'L'` and everyone
// else is right-handed.
import { quarterbacks } from '../../features/ranker/quarterbacks.js';

const LEFT_HANDED = new Set(
  quarterbacks.filter((qb) => qb.throws === 'L').map((qb) => qb.id)
);

export const throwsFor = (player) => {
  const saved = player?.bio?.Throws;
  if (saved === 'R' || saved === 'L') return saved;
  const id = player?.player_id ?? player?.id;
  return LEFT_HANDED.has(id) ? 'L' : 'R';
};
