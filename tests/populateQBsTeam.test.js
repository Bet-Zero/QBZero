import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FieldValue } from 'firebase-admin/firestore';

// An in-memory stand-in for the players collection, enough for populateQBs.
const store = new Map();
const writes = new Map();
const fakeDb = {
  collection: () => ({
    doc: (id) => ({
      get: async () => ({ exists: store.has(id), data: () => store.get(id) }),
      set: async (data) => {
        writes.set(id, data);
      },
    }),
    get: async () => ({ docs: [...store.keys()].map((id) => ({ id })) }),
  }),
};
vi.mock('../scripts/firebaseAdmin.js', () => ({ getAdminDb: () => fakeDb }));

const { populateQBs } = await import('../populateQBs.js');

const record = (team, extra = {}) => ({
  player_id: 'josh-allen',
  display_name: 'Josh Allen',
  bio: { Team: team, Position: 'QB' },
  ...extra,
});

describe('populateQBs and a team set on the profile', () => {
  beforeEach(() => {
    store.clear();
    writes.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('keeps a trade recorded on the profile while the list still has the old team', async () => {
    store.set(
      'josh-allen',
      record('NYG', { team_override: { team: 'NYG', list_team: 'BUF' } })
    );
    await populateQBs();

    expect(writes.get('josh-allen').bio.Team).toBe('NYG');
  });

  it('still writes the list team when nothing was set on the profile', async () => {
    store.set('josh-allen', record('MIA'));
    await populateQBs();

    expect(writes.get('josh-allen').bio.Team).toBe('BUF');
    expect(writes.get('josh-allen')).not.toHaveProperty('team_override');
  });

  it('lets the list win, and drops the marker, once the list has moved', async () => {
    store.set(
      'josh-allen',
      record('NYG', { team_override: { team: 'NYG', list_team: 'DAL' } })
    );
    await populateQBs();

    const written = writes.get('josh-allen');
    expect(written.bio.Team).toBe('BUF');
    expect(written.team_override).toEqual(FieldValue.delete());
  });
});
