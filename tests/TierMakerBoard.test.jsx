import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const players = [
  { id: 'p1', display_name: 'Patrick Mahomes', bio: { Team: 'KC' } },
  { id: 'p2', display_name: 'Josh Allen', bio: { Team: 'BUF' } },
];

const saved = { current: null };

vi.mock('@/firebaseConfig', () => ({ db: {} }));
vi.mock('@/hooks/usePlayerData.js', () => ({
  default: () => ({ players, loading: false }),
}));
vi.mock('@/hooks/useFirebaseQuery', () => ({
  default: () => ({ data: [], loading: false }),
}));
vi.mock('@/firebase/listHelpers', () => ({
  fetchAllTierLists: vi.fn(async () => [{ id: 'list1', name: 'Week 1' }]),
  fetchTierList: vi.fn(async () => saved.current),
  saveTierList: vi.fn(async () => {}),
  createTierList: vi.fn(),
}));
vi.mock('react-hot-toast', () => {
  const toast = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() });
  return { toast, default: toast };
});
vi.mock('@/features/roster/AddPlayerDrawer', () => ({ default: () => null }));
vi.mock('@/features/tierMaker/TierMakerExport', () => ({ default: () => null }));

const { default: TierMakerBoard } = await import(
  '@/features/tierMaker/TierMakerBoard'
);
const { saveTierList } = await import('@/firebase/listHelpers');

const renderBoard = () =>
  render(
    <MemoryRouter initialEntries={['/tier-maker/list1']}>
      <TierMakerBoard initialTierListId="list1" />
    </MemoryRouter>
  );

const rowLabels = (container) =>
  [...container.querySelectorAll('span.flex-1.text-center')].map(
    (el) => el.textContent
  );

describe('TierMakerBoard data', () => {
  beforeEach(() => {
    saveTierList.mockClear();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens a brand-new tier list with tiers and a pool', async () => {
    saved.current = { id: 'list1', name: 'Week 1', tiers: {}, tierOrder: [] };
    const { container } = renderBoard();
    await waitFor(() => expect(rowLabels(container)).toContain('Pool'));
    expect(rowLabels(container)).toEqual(['S', 'A', 'B', 'C', 'D', 'Pool']);
  });

  it('does not wipe a tier when a new tier is given the same name', async () => {
    saved.current = {
      id: 'list1',
      name: 'Week 1',
      tiers: { S: ['p1'], A: ['p2'], Pool: [] },
      tierOrder: ['S', 'A', 'Pool'],
    };
    renderBoard();
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
