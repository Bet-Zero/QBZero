import { DEFAULT_POOL_IDS } from '@/features/ranker/defaultPool';

export const POOL_DEFAULT = 'default';
export const POOL_ALL = 'all';

const defaultIds = new Set(DEFAULT_POOL_IDS);

/**
 * The quarterbacks a ranking runs over, picked from the active roster.
 *
 * Built from `activeRoster` rather than the id list, so a retired quarterback
 * still named in the default pool drops out instead of being ranked.
 */
export const buildPool = (activeRoster, choice) =>
  choice === POOL_ALL
    ? activeRoster
    : activeRoster.filter((qb) => defaultIds.has(qb.id));

/**
 * Which option a saved pool came from. Anything reaching outside the default
 * pool can only have come from the full list (or a shared link built on it).
 */
export const poolChoiceFor = (pool) =>
  pool.every((qb) => defaultIds.has(qb.id)) ? POOL_DEFAULT : POOL_ALL;

/**
 * Drop setup selections naming quarterbacks the pool no longer has. Switching
 * from the full list to the default would otherwise keep, say, a top-tier tag
 * on a backup who is no longer shown — invisible, and still counted against
 * the tier's limit.
 */
export const restrictSetupToPool = (setupData, pool) => {
  if (!setupData) return setupData;
  const ids = new Set(pool.map((qb) => qb.id));
  const keep = (id) => (id && ids.has(id) ? id : null);

  return {
    ...setupData,
    topTier: (setupData.topTier || []).filter((id) => ids.has(id)),
    bottomTier: (setupData.bottomTier || []).filter((id) => ids.has(id)),
    anchor: keep(setupData.anchor),
    firstPlace: keep(setupData.firstPlace),
    lastPlace: keep(setupData.lastPlace),
  };
};
