import { calculateRankingMovement } from '@/utils/rankingMovement';

/**
 * What changed between one archive and the one before it.
 *
 * The history list showed a date and a quarterback count, so two archives
 * taken a week apart were indistinguishable without opening both. Everything
 * needed to say more is already loaded -- the boards themselves -- and
 * calculateRankingMovement already does the comparison.
 *
 * @param {Array} current - the newer board
 * @param {Array} previous - the board it replaced
 * @returns {{
 *   riser: {name: string, positions: number}|null,
 *   faller: {name: string, positions: number}|null,
 *   added: number,
 *   removed: number,
 *   unchanged: boolean,
 * }|null} null when there is nothing to compare against
 */
export const summariseRankingChange = (current, previous) => {
  if (!current?.length || !previous?.length) return null;

  const movement = calculateRankingMovement(current, previous);
  const byId = new Map(current.map((qb) => [qb.id, qb]));
  const rankById = new Map(current.map((qb, index) => [qb.id, index + 1]));

  let riser = null;
  let faller = null;
  let added = 0;

  // Two quarterbacks can move the same distance. Break the tie on where they
  // ended up, so the summary is the same every time it is computed rather than
  // depending on the order the map happened to be walked in.
  const beats = (candidate, held) =>
    !held ||
    candidate.positions > held.positions ||
    (candidate.positions === held.positions && candidate.rank < held.rank);

  Object.entries(movement).forEach(([id, entry]) => {
    if (entry.isNew) {
      added += 1;
      return;
    }
    if (!entry.moved) return;

    const candidate = {
      name: byId.get(id)?.name || id,
      positions: entry.positions,
      rank: rankById.get(id) ?? Number.MAX_SAFE_INTEGER,
    };

    if (entry.direction === 'up') {
      if (beats(candidate, riser)) riser = candidate;
    } else if (beats(candidate, faller)) {
      faller = candidate;
    }
  });

  const currentIds = new Set(current.map((qb) => qb.id));
  const removed = previous.filter((qb) => !currentIds.has(qb.id)).length;

  const strip = (entry) =>
    entry ? { name: entry.name, positions: entry.positions } : null;

  return {
    riser: strip(riser),
    faller: strip(faller),
    added,
    removed,
    unchanged: !riser && !faller && !added && !removed,
  };
};

/** A one-line rendering of the above, for a list row. */
export const describeRankingChange = (summary) => {
  if (!summary) return null;
  if (summary.unchanged) return 'No changes';

  const parts = [];
  if (summary.riser) {
    parts.push(`▲ ${summary.riser.name} +${summary.riser.positions}`);
  }
  if (summary.faller) {
    parts.push(`▼ ${summary.faller.name} −${summary.faller.positions}`);
  }
  if (summary.added) parts.push(`+${summary.added} added`);
  if (summary.removed) parts.push(`−${summary.removed} removed`);

  return parts.join(' · ');
};
