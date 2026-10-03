import { describe, it, expect } from 'vitest';
import {
  listTeamFor,
  resolveListTeam,
  teamOverrideForSave,
} from '@/utils/roster/teamOverride';

// Josh Allen is on the list as BUF; these tests lean on that.
const LIST = listTeamFor('josh-allen');

const player = (extra = {}) => ({
  player_id: 'josh-allen',
  bio: { Team: LIST, Position: 'QB' },
  ...extra,
});

describe('teamOverrideForSave', () => {
  it('records a team changed on the profile against what the list says', () => {
    expect(LIST).toBe('BUF');
    expect(teamOverrideForSave({ player: player(), team: 'NYG' })).toEqual({
      team: 'NYG',
      list_team: 'BUF',
    });
  });

  it('marks nothing when the team was not touched', () => {
    // A grade edit on a record the list has not been applied to yet must not
    // pin that stale team against the list.
    const stale = player({ bio: { Team: 'MIA', Position: 'QB' } });
    expect(teamOverrideForSave({ player: stale, team: 'MIA' })).toBeNull();
  });

  it('keeps a marker loaded with the record on unrelated saves', () => {
    const marker = { team: 'NYG', list_team: 'BUF' };
    const edited = player({
      bio: { Team: 'NYG', Position: 'QB' },
      team_override: marker,
    });
    expect(teamOverrideForSave({ player: edited, team: 'NYG' })).toEqual(
      marker
    );
  });

  it('clears the marker when the team is set back to the list', () => {
    const edited = player({
      bio: { Team: 'NYG', Position: 'QB' },
      team_override: { team: 'NYG', list_team: 'BUF' },
    });
    expect(teamOverrideForSave({ player: edited, team: 'BUF' })).toBeNull();
  });

  it('writes nothing before the page has a team', () => {
    expect(teamOverrideForSave({ player: player(), team: '' })).toBeUndefined();
  });
});

describe('resolveListTeam', () => {
  it('uses the list when nothing was set on the profile', () => {
    expect(resolveListTeam('BUF', { bio: { Team: 'MIA' } })).toEqual({
      team: 'BUF',
      keptOverride: false,
      clearOverride: false,
    });
  });

  it('keeps a profile team while the list has not moved since the edit', () => {
    const existing = {
      bio: { Team: 'NYG' },
      team_override: { team: 'NYG', list_team: 'BUF' },
    };
    expect(resolveListTeam('BUF', existing)).toEqual({
      team: 'NYG',
      keptOverride: true,
      clearOverride: false,
    });
  });

  it('drops the profile team once the list catches up to it', () => {
    const existing = { team_override: { team: 'NYG', list_team: 'BUF' } };
    expect(resolveListTeam('NYG', existing)).toEqual({
      team: 'NYG',
      keptOverride: false,
      clearOverride: true,
    });
  });

  it('lets a newer list win over an older profile edit', () => {
    // Traded to NYG on the profile, then cut and signed by DAL -- recorded in
    // the list, not on the profile.
    const existing = { team_override: { team: 'NYG', list_team: 'BUF' } };
    expect(resolveListTeam('DAL', existing)).toEqual({
      team: 'DAL',
      keptOverride: false,
      clearOverride: true,
    });
  });
});
