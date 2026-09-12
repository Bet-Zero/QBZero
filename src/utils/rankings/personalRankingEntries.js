/**
 * The shape of one entry on a personal ranking board, and the three operations
 * every writer needs.
 *
 * An entry is a denormalised copy -- name, team, image, notes -- because an
 * archived snapshot has to keep showing what the board looked like at the time.
 * But it also carries `id`, and when that id belongs to a quarterback on the
 * curated roster the live board resolves the fields that go stale from the
 * record instead of trusting the copy.
 *
 * `id` used to be minted here (`qb-<timestamp>-<counter>-<random>`) even for
 * quarterbacks picked straight out of the roster, which threw away the only
 * link back to the player document. Movement compares boards by id, so removing
 * a quarterback and adding him back -- the normal way to correct a stale team --
 * made him a different player to the comparison and flagged him NEW. Keep the
 * roster id; generate one only for a manual entry that has no record to point at.
 */

/** Manual entries have no roster id, so they get one that cannot collide with one. */
export const MANUAL_ENTRY_PREFIX = 'manual-';

let manualCounter = 0;

export const generateManualEntryId = () =>
  `${MANUAL_ENTRY_PREFIX}${Date.now()}-${(manualCounter += 1)}-${Math.random()
    .toString(36)
    .slice(2, 11)}`;

/** True for an id this module invented rather than one from the roster. */
export const isManualEntryId = (id) =>
  typeof id === 'string' && id.startsWith(MANUAL_ENTRY_PREFIX);

/**
 * Number a list from 1 in array order.
 *
 * Rank is stored as well as implied by position, and the two used to be kept in
 * step by four separate copies of this line -- one per reorder handler -- with
 * the add path missing it entirely, which is how "Add All" came to give every
 * quarterback the same rank. Route every write to the array through here.
 */
export const withRanks = (entries = []) =>
  entries.map((entry, index) => ({ ...entry, rank: index + 1 }));

/**
 * Build an entry from whatever the Add QB modal collected.
 * A roster pick arrives with its own id; a manual entry does not.
 */
export const toRankingEntry = (qbData = {}) => ({
  name: '',
  team: '',
  imageUrl: '',
  notes: '',
  ...qbData,
  id: qbData.id || generateManualEntryId(),
});

/**
 * The entry for a quarterback picked out of the curated roster.
 * The id is the roster id, which is also the Firestore player document id and
 * the headshot filename -- the one value worth keeping.
 */
export const toRosterEntry = (qb) => ({
  id: qb.id,
  name: qb.name,
  team: qb.team || '',
  imageUrl: `/assets/headshots/${qb.id}.png`,
  notes: '',
});

/**
 * Append one or many additions to a board, renumbering the result.
 * Accepts an array so that adding thirty quarterbacks is one state update
 * rather than thirty that each read the same stale length.
 */
export const appendToRanking = (current = [], additions = []) =>
  withRanks([
    ...current,
    ...(Array.isArray(additions) ? additions : [additions]).map(toRankingEntry),
  ]);

/**
 * Refresh the fields that go stale on a *live* board from the roster.
 *
 * Only `team` is resolved: a quarterback's headshot path is derived from an id
 * that never changes, and his name is not a moving target, but his team is --
 * and a board that has carried him since last season would otherwise keep
 * showing where he used to play until he was removed and re-added.
 *
 * Never apply this to an archive. A snapshot is supposed to show the board as
 * it stood, stale teams and all.
 */
export const resolveRankingEntries = (entries = [], roster = []) => {
  if (!roster.length) return entries;
  const byId = new Map(roster.map((qb) => [qb.id, qb]));

  return entries.map((entry) => {
    const record = byId.get(entry.id);
    if (!record || !record.team || record.team === entry.team) return entry;
    return { ...entry, team: record.team };
  });
};

/** Ids already on the board, for keeping the Add QB pool free of duplicates. */
export const rankingEntryIds = (entries = []) =>
  new Set(entries.map((entry) => entry.id).filter(Boolean));
