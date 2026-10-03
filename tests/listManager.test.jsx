import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const helpers = {
  fetchAllLists: vi.fn(),
  fetchList: vi.fn(),
  saveList: vi.fn(),
  createList: vi.fn(),
  addPlayerToList: vi.fn(),
};
vi.mock('@/firebase/listHelpers', () => helpers);
const createTierBoardFromList = vi.fn();
vi.mock('@/firebase/listTierLink', () => ({
  createTierBoardFromList: (...a) => createTierBoardFromList(...a),
}));
vi.mock('react-hot-toast', () => {
  const toast = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() });
  return { toast, default: toast };
});

const players = [
  { id: 'a', player_id: 'a', display_name: 'Alpha QB' },
  { id: 'b', player_id: 'b', display_name: 'Bravo QB' },
  { id: 'c', player_id: 'c', display_name: 'Charlie QB' },
];
vi.mock('@/hooks/usePlayerData.js', () => ({
  default: () => ({ players, loading: false }),
}));
// The table row pulls in drawers, grades and the add-to-list button; the
// editor only needs to know which player a row is for.
vi.mock('@/features/table/PlayerTable/PlayerRow', () => ({
  default: ({ player }) => <div>{player.display_name}</div>,
}));

const ListManager = (await import('@/pages/ListManager.jsx')).default;
const AddToListModal = (
  await import('@/features/lists/AddToListButton/AddToListModal.jsx')
).default;

const renderAt = (id) =>
  render(
    <MemoryRouter initialEntries={[`/lists/${id}`]}>
      <Routes>
        <Route path="/lists/:listId" element={<ListManager />} />
        <Route path="/tier-maker/:id" element={<div>tier board page</div>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  Object.values(helpers).forEach((fn) => fn.mockReset());
  helpers.fetchAllLists.mockResolvedValue([]);
  helpers.saveList.mockResolvedValue();
  createTierBoardFromList.mockReset();
});
afterEach(cleanup);

describe('ListManager', () => {
  it('removes the clicked player in the flat view when the list has tiers', async () => {
    helpers.fetchList.mockResolvedValue({
      id: 'l1',
      name: 'My List',
      playerOrder: ['a', 'divider::Tier Two', 'b', 'c'],
      playerIds: ['a', 'b', 'c'],
    });
    renderAt('l1');
    await screen.findByText('My List');

    // Switch the editor to the unranked (flat) view.
    fireEvent.click(screen.getAllByText('Flat')[0]);
    await screen.findByText('Bravo QB');

    const removeButtons = screen.getAllByTitle('Remove from List');
    fireEvent.click(removeButtons[1]); // Bravo
    fireEvent.click(screen.getByText(/Save List/));

    await waitFor(() => expect(helpers.saveList).toHaveBeenCalled());
    expect(helpers.saveList.mock.calls[0][1]).toMatchObject({
      playerOrder: ['a', 'divider::Tier Two', 'c'],
      playerIds: ['a', 'c'],
    });
  });

  it('shows a removable row for a player no longer on the roster', async () => {
    helpers.fetchList.mockResolvedValue({
      id: 'l1',
      name: 'Stale List',
      playerIds: ['a', 'retired-guy'],
    });
    renderAt('l1');
    await screen.findByText(/retired-guy/);
    fireEvent.click(screen.getAllByText('Flat')[0]);
    expect(await screen.findByText(/retired-guy/)).toBeTruthy();
  });

  it('says so when the list does not exist instead of loading forever', async () => {
    helpers.fetchList.mockResolvedValue(null);
    renderAt('nope');
    expect(await screen.findByText(/does not exist/)).toBeTruthy();
  });
});

describe('ListManager → tier board', () => {
  it('makes a tier board from the list as shown and opens it', async () => {
    helpers.fetchList.mockResolvedValue({
      id: 'l1',
      name: 'My List',
      playerOrder: ['divider::Elite', 'a', 'divider::Good', 'b'],
      playerIds: ['a', 'b', 'c'],
    });
    createTierBoardFromList.mockResolvedValue('board1');
    renderAt('l1');
    await screen.findByText('My List');
    fireEvent.click(screen.getByText('Open as Tier Board'));
    expect(await screen.findByText('tier board page')).toBeTruthy();
    expect(createTierBoardFromList).toHaveBeenCalledWith({
      id: 'l1',
      name: 'My List',
      playerOrder: ['divider::Elite', 'a', 'divider::Good', 'b', 'c'],
    });
  });

  it('asks for a save first when the list has unsaved changes', async () => {
    helpers.fetchList.mockResolvedValue({
      id: 'l1',
      name: 'My List',
      playerIds: ['a', 'b'],
    });
    renderAt('l1');
    await screen.findByText('My List');
    fireEvent.click(screen.getAllByTitle('Remove from List')[0]);
    fireEvent.click(screen.getByText('Open as Tier Board'));
    expect(createTierBoardFromList).not.toHaveBeenCalled();
  });
});

describe('AddToListModal', () => {
  it('creates a new list with a generated id instead of overwriting by name', async () => {
    helpers.createList.mockResolvedValue('new-id');
    const onClose = vi.fn();
    render(<AddToListModal player={{ id: 'a' }} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText(/Free Agent Rankings/), {
      target: { value: 'Top Ten' },
    });
    fireEvent.click(screen.getByText('Add'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(helpers.createList).toHaveBeenCalledWith('Top Ten', ['a']);
  });

  it('reports a duplicate name rather than replacing that list', async () => {
    helpers.createList.mockRejectedValue(
      new Error('A list with this name already exists.')
    );
    const onClose = vi.fn();
    render(<AddToListModal player={{ id: 'a' }} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText(/Free Agent Rankings/), {
      target: { value: 'Top Ten' },
    });
    fireEvent.click(screen.getByText('Add'));
    await waitFor(() => expect(helpers.createList).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });
});
