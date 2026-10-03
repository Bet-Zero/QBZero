import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

const rawPlayers = [
  {
    id: 'qb1',
    display_name: 'Patrick Mahomes',
    bio: { Team: 'KC', Position: 'QB' },
  },
];

vi.mock('@/hooks/usePlayerData.js', () => ({
  default: () => ({ players: rawPlayers, loading: false }),
}));
vi.mock('@/hooks/useFirebaseQuery', () => ({
  default: () => ({ data: [], loading: false }),
}));
const fetchTierList = vi.fn();
vi.mock('@/firebase/listHelpers', () => ({
  fetchTierList: (...a) => fetchTierList(...a),
  saveTierList: vi.fn(),
  createTierList: vi.fn(),
}));
vi.mock('@/components/shared/TeamLogo', () => ({
  default: ({ teamAbbr }) => <span data-testid="team-logo">{teamAbbr}</span>,
}));
vi.mock('@/features/roster/AddPlayerDrawer', () => ({
  default: ({ allPlayers, onSelect }) => (
    <div>
      {allPlayers.map((p) => (
        <button key={p.id} onClick={() => onSelect(p)}>
          add {p.name}
        </button>
      ))}
    </div>
  ),
}));

import TierMakerBoard from '@/features/tierMaker/TierMakerBoard';

afterEach(() => {
  cleanup();
  fetchTierList.mockReset();
});

describe('TierMakerBoard', () => {
  it('keeps team and proper name for a player added from the drawer', () => {
    render(<TierMakerBoard />);
    fireEvent.click(screen.getByText('add patrick mahomes'));
    expect(screen.getByTestId('team-logo').textContent).toBe('KC');
    expect(screen.getByText('MAHOMES')).toBeTruthy();
  });

  it('can add players after loading a freshly created, empty list', async () => {
    fetchTierList.mockResolvedValue({ id: 'new', tiers: {}, tierOrder: [] });
    render(<TierMakerBoard initialTierListId="new" />);
    await waitFor(() => expect(fetchTierList).toHaveBeenCalled());
    await screen.findByText('S');
    fireEvent.click(screen.getByText('add patrick mahomes'));
    expect(screen.getByText('MAHOMES')).toBeTruthy();
  });

  it('does not wipe a tier when adding one with an existing name', () => {
    vi.spyOn(window, 'prompt').mockReturnValue('A');
    render(<TierMakerBoard />);
    fireEvent.click(screen.getByText('add patrick mahomes'));
    // Move the player from Pool up into D, then try to add a second "D".
    fireEvent.click(screen.getByText('↑'));
    window.prompt.mockReturnValue('D');
    fireEvent.click(screen.getByText('Add Tier'));
    expect(screen.getAllByText('D')).toHaveLength(1);
    expect(screen.getByText('MAHOMES')).toBeTruthy();
    window.prompt.mockRestore();
  });
});
