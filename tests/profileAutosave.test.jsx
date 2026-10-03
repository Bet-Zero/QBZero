import React from 'react';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
  within,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { normalizePlayerData } from '@/utils/roster';

const savePlayerData = vi.fn();
vi.mock('@/firebaseHelpers', () => ({
  savePlayerData: (...args) => savePlayerData(...args),
}));
vi.mock('@/hooks/useAuth', () => ({
  default: () => ({ user: { email: 'a@b.c' }, isAdmin: true }),
}));
vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/components/shared/QBRankingBadge', () => ({ default: () => null }));
vi.mock('@/components/shared/PlayerHeadshot', () => ({ default: () => null }));

// Two quarterbacks on one team, as normalized records -- which is what the
// page receives. Neither has a running profile, so both carry the table's '—'.
const players = [
  {
    id: 'qb-allen',
    player_id: 'qb-allen',
    display_name: 'Tom Allen',
    bio: { Team: 'PIT', Position: 'QB' },
  },
  {
    id: 'qb-baker',
    player_id: 'qb-baker',
    display_name: 'Sam Baker',
    bio: { Team: 'PIT', Position: 'QB' },
  },
].map(normalizePlayerData);

vi.mock('@/hooks/usePlayerData.js', () => ({
  default: () => ({ players, loading: false }),
}));

const { default: PlayerProfileView } = await import(
  '@/pages/PlayerProfileView'
);

// Lets queued saves and their follow-up state updates run.
const settle = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

const advance = async (ms) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
  await settle();
};

const pickTeam = () => {
  fireEvent.change(screen.getAllByRole('combobox')[0], {
    target: { value: 'PIT' },
  });
};

const savedFor = (id) =>
  savePlayerData.mock.calls.filter(([pid]) => pid === id).map(([, d]) => d);

describe('profile autosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    savePlayerData.mockReset();
    savePlayerData.mockResolvedValue(undefined);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('saves a running profile pick on its own', async () => {
    render(<PlayerProfileView />);
    pickTeam();

    fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
    await advance(1000);

    expect(savedFor('qb-allen')).toHaveLength(1);
    expect(savedFor('qb-allen')[0].runningProfile).toBe('Plus');
  });

  it('saves a badge toggle on its own', async () => {
    render(<PlayerProfileView />);
    pickTeam();

    fireEvent.click(screen.getByRole('button', { name: 'BADGES ▼' }));
    fireEvent.click(screen.getByRole('button', { name: /Cannon Arm/ }));
    await advance(1000);

    expect(savedFor('qb-allen')[0].badges).toEqual(['cannon_arm']);
  });

  it('does not store the table placeholder as a running profile', async () => {
    render(<PlayerProfileView />);
    pickTeam();

    fireEvent.click(screen.getByRole('button', { name: /^Status/ }));
    await advance(1000);

    expect(savedFor('qb-allen')[0].runningProfile).toBe('');
  });

  it('writes an edit made just before moving to the next player', async () => {
    render(<PlayerProfileView />);
    pickTeam();

    fireEvent.click(screen.getByRole('button', { name: 'Elite' }));
    fireEvent.click(screen.getByRole('button', { name: '▶' }));
    await settle();

    expect(savedFor('qb-allen')).toHaveLength(1);
    expect(savedFor('qb-allen')[0].runningProfile).toBe('Elite');

    // Nothing of Allen's is written onto Baker.
    await advance(2000);
    expect(savedFor('qb-baker')).toHaveLength(0);
  });

  it('shows the saved values on returning to a player', async () => {
    render(<PlayerProfileView />);
    pickTeam();

    // Status saved even before this change, so this isolates the reload.
    fireEvent.click(screen.getByRole('button', { name: /^Status: Active/ }));
    await advance(1000);
    expect(savedFor('qb-allen')[0].status).toBe('retired');

    fireEvent.click(screen.getByRole('button', { name: '▶' }));
    fireEvent.click(screen.getByRole('button', { name: '◀' }));
    await settle();

    expect(
      screen.getByRole('button', { name: /^Status: Retired/ })
    ).toBeTruthy();
  });

  it('keeps an arm talent note', async () => {
    render(<PlayerProfileView />);
    pickTeam();

    fireEvent.click(screen.getByTitle('Edit Arm Talent blurb'));
    const dialog = screen
      .getByText('Arm Talent Meter Breakdown')
      .closest('div');
    fireEvent.change(
      within(dialog.parentElement).getByPlaceholderText(
        'Write your breakdown here...'
      ),
      { target: { value: 'Throws a lively ball.' } }
    );
    await advance(1000);

    expect(savedFor('qb-allen')[0].blurbs.armTalentMeter).toBe(
      'Throws a lively ball.'
    );
  });
});
