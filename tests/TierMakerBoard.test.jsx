import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  within,
} from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';

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
  fetchTierListVersions: (...a) => fetchTierListVersions(...a),
  saveNamedTierListVersion: (...a) => saveNamedTierListVersion(...a),
  createTierList: vi.fn(),
}));
const fetchTierListVersions = vi.fn(async () => []);
const saveNamedTierListVersion = vi.fn(async () => 'named1');
const sendTierBoardToList = vi.fn(async () => {});
vi.mock('@/firebase/listTierLink', () => ({
  sendTierBoardToList: (...a) => sendTierBoardToList(...a),
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
vi.mock('@/features/tierMaker/TierMakerExport', () => ({
  default: () => null,
}));

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

// Answer the in-app confirm dialog.
const answer = async (label) => {
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByText(label));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
};

// Fill in and confirm the in-app naming dialog.
const nameIt = async (title, value) => {
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText(title), {
    target: { value },
  });
  const buttons = within(dialog).getAllByRole('button');
  fireEvent.click(buttons[buttons.length - 1]);
};

afterEach(() => {
  cleanup();
  fetchTierList.mockReset();
  saveTierList.mockClear();
  saveTierList.mockImplementation(async () => {});
  fetchTierListVersions.mockReset();
  fetchTierListVersions.mockImplementation(async () => []);
  saveNamedTierListVersion.mockClear();
  sendTierBoardToList.mockClear();
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
    fireEvent.click(screen.getByText('Add Tier'));
    await nameIt('Add tier', 'S');
    expect((await screen.findByRole('alert')).textContent).toMatch(/already/);
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Cancel'));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByText(/^Saved?$/));
    await waitFor(() => expect(saveTierList).toHaveBeenCalled());
    expect(saveTierList.mock.calls[0][1]).toEqual({
      tiers: { S: ['p1'], A: ['p2'], Pool: [] },
      tierOrder: ['S', 'A', 'Pool'],
    });
  });

  it('sends a board made from a list back to that list', async () => {
    fetchTierList.mockResolvedValue({
      id: 'list1',
      name: 'Week 1',
      tiers: { S: ['p1', 'gone'], A: [], Pool: ['p2'] },
      tierOrder: ['S', 'A', 'Pool'],
      sourceList: { id: 'l9', name: 'Top QBs' },
    });
    renderBoard('list1');
    await screen.findByText('MAHOMES');
    const native = vi.spyOn(window, 'confirm');
    fireEvent.click(screen.getByText('Send to "Top QBs"'));
    expect(
      within(await screen.findByRole('dialog')).getByText(
        'Send this board to "Top QBs"?'
      )
    ).toBeTruthy();
    expect(sendTierBoardToList).not.toHaveBeenCalled();
    await answer('Send');
    expect(native).not.toHaveBeenCalled();
    await waitFor(() => expect(sendTierBoardToList).toHaveBeenCalled());
    expect(sendTierBoardToList).toHaveBeenCalledWith('l9', {
      tiers: { S: ['p1', 'gone'], A: [], Pool: ['p2'] },
      tierOrder: ['S', 'A', 'Pool'],
    });
  });

  it('offers no send button on a board not made from a list', async () => {
    fetchTierList.mockResolvedValue({
      id: 'list1',
      tiers: { S: ['p1'], Pool: [] },
      tierOrder: ['S', 'Pool'],
    });
    renderBoard('list1');
    await screen.findByText('MAHOMES');
    expect(screen.queryByText(/^Send to/)).toBeNull();
  });
});

const savedList = {
  id: 'list1',
  name: 'Week 1',
  tiers: { S: ['p1'], A: [], Pool: ['p2'] },
  tierOrder: ['S', 'A', 'Pool'],
};

describe('TierMakerBoard saving', () => {
  it('saves a change on its own after a short pause', async () => {
    fetchTierList.mockResolvedValue(savedList);
    renderBoard('list1');
    await screen.findByText('MAHOMES');
    fireEvent.click(screen.getByText('Add Tier'));
    await nameIt('Add tier', 'Elite');
    expect(saveTierList).not.toHaveBeenCalled();
    await waitFor(() => expect(saveTierList).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });
    expect(saveTierList.mock.calls[0]).toEqual([
      'list1',
      {
        tiers: { S: ['p1'], A: [], Elite: [], Pool: ['p2'] },
        tierOrder: ['S', 'A', 'Elite', 'Pool'],
      },
    ]);
    await screen.findByText('Saved');
  });

  it('saves a pending change when the page is left before autosave runs', async () => {
    fetchTierList.mockResolvedValue(savedList);
    const { unmount } = renderBoard('list1');
    await screen.findByText('MAHOMES');
    fireEvent.click(screen.getByText('Add Tier'));
    await nameIt('Add tier', 'Elite');
    unmount();
    expect(saveTierList).toHaveBeenCalledTimes(1);
    expect(saveTierList.mock.calls[0][1].tierOrder).toEqual([
      'S',
      'A',
      'Elite',
      'Pool',
    ]);
  });

  it('asks in-app before following a link away from a board that is saved nowhere', async () => {
    render(
      <MemoryRouter initialEntries={['/tier-maker']}>
        <Routes>
          <Route
            path="/tier-maker"
            element={
              <>
                <Link to="/elsewhere">go elsewhere</Link>
                <TierMakerBoard />
              </>
            }
          />
          <Route path="/elsewhere" element={<p>Elsewhere</p>} />
        </Routes>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('add patrick mahomes'));
    const native = vi.spyOn(window, 'confirm');
    fireEvent.click(screen.getByText('go elsewhere'));
    await answer('Keep editing');
    expect(screen.queryByText('Elsewhere')).toBeNull();
    fireEvent.click(screen.getByText('go elsewhere'));
    await answer('Discard');
    expect(await screen.findByText('Elsewhere')).toBeTruthy();
    expect(native).not.toHaveBeenCalled();
  });
});

describe('TierMakerBoard history', () => {
  const oldVersion = {
    id: '2026-09-01',
    tiers: { S: ['p2'], Pool: ['p1'] },
    tierOrder: ['S', 'Pool'],
  };

  const openHistory = async () => {
    fetchTierList.mockResolvedValue(savedList);
    fetchTierListVersions.mockResolvedValue([oldVersion]);
    const { container } = renderBoard('list1');
    await screen.findByLabelText('History');
    fireEvent.change(screen.getByLabelText('History'), {
      target: { value: '2026-09-01' },
    });
    await screen.findByText(/Viewing this board as saved on/);
    return container;
  };

  it('shows an old version without saving it, then goes back', async () => {
    const container = await openHistory();
    expect(
      screen.getByText(/Viewing this board as saved on/).textContent
    ).toContain('Sep 1, 2026');
    expect(rowLabels(container)).toEqual(['S', 'Pool']);
    await new Promise((r) => setTimeout(r, 2000));
    expect(saveTierList).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Back to current'));
    expect(rowLabels(container)).toEqual(['S', 'A', 'Pool']);
    expect(screen.queryByText(/Viewing this board/)).toBeNull();
  });

  it('restoring an old version saves it as the current board', async () => {
    await openHistory();
    fireEvent.click(screen.getByText('Restore this version'));
    await waitFor(() => expect(saveTierList).toHaveBeenCalled(), {
      timeout: 3000,
    });
    expect(saveTierList.mock.calls[0][1]).toEqual({
      tiers: { S: ['p2'], Pool: ['p1'] },
      tierOrder: ['S', 'Pool'],
    });
  });
});

describe('TierMakerBoard confirm dialog', () => {
  it('asks in-app before clearing the board', async () => {
    fetchTierList.mockResolvedValue(savedList);
    const { container } = renderBoard('list1');
    await screen.findByText('MAHOMES');
    fireEvent.click(screen.getByText('Reset'));
    await answer('Cancel');
    expect(screen.getByText('MAHOMES')).toBeTruthy();
    fireEvent.click(screen.getByText('Reset'));
    await answer('Clear');
    expect(screen.queryByText('MAHOMES')).toBeNull();
    expect(rowLabels(container)).toEqual(['S', 'A', 'B', 'C', 'D', 'Pool']);
  });
});

describe('TierMakerBoard naming dialog', () => {
  it('renames a tier in an in-app dialog, prefilled with its name', async () => {
    fetchTierList.mockResolvedValue(savedList);
    const { container } = renderBoard('list1');
    await screen.findByText('MAHOMES');
    fireEvent.click(screen.getByLabelText('Rename tier S'));
    const input = within(await screen.findByRole('dialog')).getByLabelText(
      'Rename tier'
    );
    expect(input.value).toBe('S');
    await nameIt('Rename tier', 'Elite');
    await waitFor(() =>
      expect(rowLabels(container)).toEqual(['Elite', 'A', 'Pool'])
    );
  });
});

describe('TierMakerBoard named versions', () => {
  it('saves the current board under a name', async () => {
    fetchTierList.mockResolvedValue(savedList);
    renderBoard('list1');
    await screen.findByText('MAHOMES');
    const prompt = vi.spyOn(window, 'prompt');
    fireEvent.click(screen.getByText('Save as version'));
    await nameIt('Save as version', '  Preseason ');
    await waitFor(() => expect(saveNamedTierListVersion).toHaveBeenCalled());
    expect(prompt).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(saveNamedTierListVersion).toHaveBeenCalledWith(
      'list1',
      { tiers: savedList.tiers, tierOrder: savedList.tierOrder },
      'Preseason'
    );
  });

  it('lists a named version apart from the daily ones and shows its name', async () => {
    fetchTierList.mockResolvedValue(savedList);
    fetchTierListVersions.mockResolvedValue([
      {
        id: 'named1',
        label: 'Preseason',
        day: '2026-09-01',
        tiers: { S: ['p2'], Pool: ['p1'] },
        tierOrder: ['S', 'Pool'],
      },
      {
        id: '2026-10-03',
        tiers: savedList.tiers,
        tierOrder: savedList.tierOrder,
      },
    ]);
    const { container } = renderBoard('list1');
    const history = await screen.findByLabelText('History');
    const groups = [...history.querySelectorAll('optgroup')].map((g) => [
      g.label,
      [...g.querySelectorAll('option')].map((o) => o.textContent),
    ]);
    expect(groups).toEqual([
      ['Named', ['📌 Preseason · Sep 1, 2026']],
      ['By day', ['Oct 3, 2026']],
    ]);
    fireEvent.change(history, { target: { value: 'named1' } });
    expect(
      (await screen.findByText(/Viewing this board as saved on/)).textContent
    ).toContain('Preseason');
    expect(rowLabels(container)).toEqual(['S', 'Pool']);
  });
});
