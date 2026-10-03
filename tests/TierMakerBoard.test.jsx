import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const rawPlayers = [
  {
    id: 'p1',
    display_name: 'Patrick Mahomes',
    bio: { Team: 'KC', Position: 'QB' },
  },
  { id: 'p2', display_name: 'Josh Allen', bio: { Team: 'BUF' } },
];

vi.mock('@/firebaseConfig', () => ({ db: {} }));
vi.mock('@/hooks/usePlayerData.js', () => ({
  default: () => ({ players: rawPlayers, loading: false }),
}));
vi.mock('@/hooks/useFirebaseQuery', () => ({
  default: () => ({ data: [], loading: false }),
}));
const fetchTierList = vi.fn();
const saveTierList = vi.fn(async () => {});
vi.mock('@/firebase/listHelpers', () => ({
  fetchAllTierLists: vi.fn(async () => [{ id: 'list1', name: 'Week 1' }]),
  fetchTierList: (...a) => fetchTierList(...a),
  saveTierList: (...a) => saveTierList(...a),
  createTierList: vi.fn(),
}));
vi.mock('react-hot-toast', () => {
  const toast = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() });
  return { toast, default: toast };
});
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
vi.mock('@/features/tierMaker/TierMakerExport', () => ({ default: () => null }));

import TierMakerBoard from '@/features/tierMaker/TierMakerBoard';

const renderBoard = (initialTierListId) =>
  render(
    <MemoryRouter
      initialEntries={[
        initialTierListId ? `/tier-maker/${initialTierListId}` : '/tier-maker',
      ]}
    >
      <TierMakerBoard initialTierListId={initialTierListId} />
    </MemoryRouter>
  );

const rowLabels = (container) =>
  [...container.querySelectorAll('span.flex-1.text-center')].map(
    (el) => el.textContent
  );

afterEach(() => {
  cleanup();
  fetchTierList.mockReset();
  saveTierList.mockClear();
  vi.restoreAllMocks();
});

describe('TierMakerBoard', () => {
  it('keeps team and proper name for a player added from the drawer', () => {
    renderBoard();
    fireEvent.click(screen.getByText('add patrick mahomes'));
    expect(screen.getByTestId('team-logo').textContent).toBe('KC');
    expect(screen.getByText('MAHOMES')).toBeTruthy();
  });

  it('opens a brand-new tier list with tiers and a pool, and can add to it', async () => {
    fetchTierList.mockResolvedValue({ id: 'new', tiers: {}, tierOrder: [] });
    const { container } = renderBoard('new');
    await waitFor(() => expect(rowLabels(container)).toContain('Pool'));
    expect(rowLabels(container)).toEqual(['S', 'A', 'B', 'C', 'D', 'Pool']);
    fireEvent.click(screen.getByText('add patrick mahomes'));
    expect(screen.getByText('MAHOMES')).toBeTruthy();
  });

  it('does not wipe a tier when a new tier is given the same name', async () => {
    fetchTierList.mockResolvedValue({
      id: 'list1',
      name: 'Week 1',
      tiers: { S: ['p1'], A: ['p2'], Pool: [] },
      tierOrder: ['S', 'A', 'Pool'],
    });
    renderBoard('list1');
    await screen.findByText('MAHOMES');
    vi.spyOn(window, 'prompt').mockReturnValue('S');
    fireEvent.click(screen.getByText('Add Tier'));
    fireEvent.click(screen.getByText(/^Save/));
    await waitFor(() => expect(saveTierList).toHaveBeenCalled());
    expect(saveTierList.mock.calls[0][1]).toEqual({
      tiers: { S: ['p1'], A: ['p2'], Pool: [] },
      tierOrder: ['S', 'A', 'Pool'],
    });
  });
});
