// A team set on the profile page, and how populateQBs reconciles it with the
// curated list.
//
// populateQBs writes every quarterback's team from quarterbacks.js on each
// run, which used to undo a trade recorded on the profile. The profile now
// saves a marker alongside the team:
//
//   team_override: { team: 'NYG', list_team: 'BUF' }
//
// `list_team` is what the list said when the edit was made. While the list
// still says that, the list simply has not caught up and the profile's team
// stands. Once the list says anything else, someone has updated it since, so
// the list is newer information and wins -- and the marker is dropped.
//
// Plain relative imports only: populateQBs.js loads this directly in Node.
import { quarterbacks } from '../../features/ranker/quarterbacks.js';

export const listTeamFor = (id) =>
  quarterbacks.find((qb) => qb.id === id)?.team ?? null;

/**
 * The `team_override` value a profile save should write.
 *
 * `undefined` means write nothing (no team on the page yet). `null` clears a
 * marker. Only a team that differs from the one the page loaded counts as an
 * edit -- otherwise an unrelated grade change on a record the list has not yet
 * been applied to would pin that stale team in place.
 */
export const teamOverrideForSave = ({ player, team }) => {
  if (!team) return undefined;
  // Unchanged this visit: keep whatever marker was loaded. Writing null when
  // there was none also clears a marker from an edit made and then reverted
  // before reload, since the page's `player` is the record as loaded.
  if (team === player?.bio?.Team) return player?.team_override ?? null;

  const listTeam = listTeamFor(player?.player_id ?? player?.id);
  if (team === listTeam) return null;
  return { team, list_team: listTeam };
};

/**
 * The team populateQBs should write for one list entry, given the saved record.
 *
 * Returns { team, keptOverride, clearOverride }.
 */
export const resolveListTeam = (listTeam, existing = {}) => {
  const override = existing.team_override;
  const hasOverride = Boolean(override && typeof override === 'object');

  if (
    hasOverride &&
    override.team &&
    override.team !== listTeam &&
    override.list_team === listTeam
  ) {
    return { team: override.team, keptOverride: true, clearOverride: false };
  }

  return { team: listTeam, keptOverride: false, clearOverride: hasOverride };
};
