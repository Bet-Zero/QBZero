import { useMemo } from 'react';
import usePlayerData from '@/hooks/usePlayerData';
import { quarterbacks } from '@/features/ranker/quarterbacks';

/**
 * The curated quarterback list, with the fields that go stale resolved from
 * the saved player record.
 *
 * `quarterbacks.js` decides *who* is worth carrying — that is editorial and
 * belongs in version control. But its `team` is a seed value: quarterbacks
 * move, and anywhere that read `qb.team` directly kept showing last season's
 * team even once the record was corrected. Read the roster through here
 * instead of importing the list straight.
 *
 * `status` comes from the record too, defaulting to active. Quarterbacks are
 * never dropped from the list when they retire — they stay rankable in past
 * contexts — so callers that only want current players filter on it.
 */
const useQBRoster = () => {
  const { players, loading } = usePlayerData();

  const roster = useMemo(() => {
    const byId = new Map((players || []).map((p) => [p.id, p]));

    return quarterbacks.map((qb) => {
      const record = byId.get(qb.id);
      return {
        ...qb,
        team: record?.bio?.Team || qb.team,
        status: record?.status || 'active',
      };
    });
  }, [players]);

  const activeRoster = useMemo(
    () => roster.filter((qb) => qb.status === 'active'),
    [roster]
  );

  return { roster, activeRoster, loading };
};

export default useQBRoster;
