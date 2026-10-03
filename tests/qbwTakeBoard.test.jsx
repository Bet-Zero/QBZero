import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { filterTakes, takeStats } from '@/utils/qbw/takes';
import { DEFAULT_SHELVES, normalizeShelves } from '@/utils/qbw/shelves';

const helpers = {
  fetchAllTakes: vi.fn(),
  createTake: vi.fn(),
  updateTake: vi.fn(),
  deleteTake: vi.fn(),
};
vi.mock('@/firebase/takeHelpers', () => helpers);
const shelfHelpers = { fetchShelves: vi.fn(), saveShelves: vi.fn() };
vi.mock('@/firebase/qbwShelfHelpers', () => shelfHelpers);
vi.mock('@/hooks/useQBRoster', () => ({
  default: () => ({
    roster: [
      { id: 'josh-allen', name: 'Josh Allen', team: 'BUF' },
      { id: 'joe-burrow', name: 'Joe Burrow', team: 'CIN' },
    ],
  }),
}));
const auth = { isAdmin: true, signOut: vi.fn() };
vi.mock('@/hooks/useAuth', () => ({ default: () => auth }));
vi.mock('react-hot-toast', () => {
  const toast = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() });
  return { toast, default: toast };
});

const QBWPage = (await import('@/pages/QBWPage.jsx')).default;

const stored = [
  {
    id: 't1',
    title: 'Josh Allen top 3',
    description: 'Called it',
    qbName: 'Josh Allen',
    date: '2018 Draft',
    proofDate: '2020 Season',
    status: 'correct',
    authorId: 'admin',
    authorName: 'Admin',
  },
  {
    id: 't2',
    title: 'Burrow wins a ring',
    description: 'Soon',
    qbName: 'Joe Burrow',
    date: '2024',
    proofDate: '',
    status: 'pending',
    authorId: 'admin',
    authorName: 'Admin',
  },
];

beforeEach(() => {
  Object.values(helpers).forEach((fn) => fn.mockReset());
  helpers.fetchAllTakes.mockResolvedValue(stored);
  helpers.createTake.mockResolvedValue({});
  helpers.updateTake.mockResolvedValue();
  helpers.deleteTake.mockResolvedValue();
  Object.values(shelfHelpers).forEach((fn) => fn.mockReset());
  shelfHelpers.fetchShelves.mockResolvedValue(null);
  shelfHelpers.saveShelves.mockResolvedValue();
  auth.isAdmin = true;
});
afterEach(cleanup);

describe('take stats', () => {
  it('counts accuracy over resolved takes only', () => {
    expect(
      takeStats([
        { status: 'correct' },
        { status: 'correct' },
        { status: 'wrong' },
        { status: 'pending' },
      ])
    ).toMatchObject({
      total: 4,
      correct: 2,
      wrong: 1,
      pending: 1,
      accuracy: 67,
    });
  });

  it('has no accuracy until something resolves', () => {
    expect(takeStats([]).accuracy).toBeNull();
    expect(takeStats([{ status: 'pending' }]).accuracy).toBeNull();
  });

  it('filters by status, author and QB without tripping on a missing QB', () => {
    const takes = [
      { status: 'correct', authorId: 'a', qbName: 'Josh Allen' },
      { status: 'pending', authorId: 'b', qbName: 'Joe Burrow' },
      { status: 'pending', authorId: 'a' },
    ];
    expect(filterTakes(takes, { status: 'pending' })).toHaveLength(2);
    expect(filterTakes(takes, { authorId: 'a' })).toHaveLength(2);
    expect(filterTakes(takes, { search: 'burrow' })).toEqual([takes[1]]);
  });
});

describe('QB Weekly page', () => {
  it('renders the board and its stats from saved takes', async () => {
    render(<QBWPage />);
    expect(await screen.findByText('Josh Allen top 3')).toBeTruthy();
    expect(screen.getByText('Burrow wins a ring')).toBeTruthy();
    // 1 correct of 1 resolved; the pending take doesn't count against it.
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getAllByText('All (2)').length).toBeGreaterThan(0);
  });

  it('lets the admin mark a pending take correct', async () => {
    render(<QBWPage />);
    fireEvent.click(await screen.findByLabelText('Edit "Burrow wins a ring"'));
    fireEvent.change(screen.getByLabelText('Status *'), {
      target: { value: 'correct' },
    });
    fireEvent.change(screen.getByLabelText('Proof Date'), {
      target: { value: 'Feb 2026' },
    });
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => expect(helpers.updateTake).toHaveBeenCalled());
    expect(helpers.updateTake).toHaveBeenCalledWith(
      't2',
      expect.objectContaining({ status: 'correct', proofDate: 'Feb 2026' })
    );
    expect(helpers.createTake).not.toHaveBeenCalled();
    await waitFor(() => expect(helpers.fetchAllTakes).toHaveBeenCalledTimes(2));
  });

  it('asks in-app before deleting a take', async () => {
    render(<QBWPage />);
    fireEvent.click(await screen.findByLabelText('Delete "Josh Allen top 3"'));
    expect(screen.getByText('Delete this take?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(helpers.deleteTake).toHaveBeenCalledWith('t1'));
  });

  it('saves a typed QB name even when no suggestion was clicked', async () => {
    render(<QBWPage />);
    await screen.findByText('Josh Allen top 3');
    fireEvent.click(screen.getAllByText('Add Take')[0]);
    fireEvent.change(screen.getByLabelText('Take Title *'), {
      target: { value: 'Mac Jones bounces back' },
    });
    fireEvent.change(screen.getByLabelText('Description *'), {
      target: { value: 'New scenery' },
    });
    fireEvent.change(screen.getByLabelText('QB Name *'), {
      target: { value: 'Mac Jones' },
    });
    fireEvent.submit(screen.getByLabelText('Take Title *').closest('form'));

    await waitFor(() => expect(helpers.createTake).toHaveBeenCalled());
    expect(helpers.createTake).toHaveBeenCalledWith(
      expect.objectContaining({ qbName: 'Mac Jones', status: 'pending' }),
      'admin',
      'Admin'
    );
  });
});

describe('crystal ball shelves', () => {
  it('normalizes saved shelves and falls back to the defaults', () => {
    expect(normalizeShelves(null)).toBe(DEFAULT_SHELVES);
    expect(normalizeShelves([])).toBe(DEFAULT_SHELVES);
    expect(
      normalizeShelves([
        {
          id: 's',
          title: ' Hits ',
          qbs: [
            { id: 'a', name: ' Jayden Daniels ', predictionText: 'OROY' },
            { id: 'b', name: '   ' },
          ],
        },
      ])
    ).toEqual([
      {
        id: 's',
        title: 'Hits',
        qbs: [
          {
            id: 'a',
            name: 'Jayden Daniels',
            imageUrl: '',
            predictionText: 'OROY',
          },
        ],
      },
    ]);
  });

  it('shows the default shelves until some are saved', async () => {
    render(<QBWPage />);
    await screen.findByText('Josh Allen top 3');
    expect(screen.getAllByText('The Whisperer').length).toBeGreaterThan(0);
    expect(screen.getAllByAltText('Kirk Cousins Crystal Ball').length).toBe(2);
    expect(screen.getByText('7')).toBeTruthy();
  });

  it('shows saved shelves, naming QBs on the generic ball', async () => {
    shelfHelpers.fetchShelves.mockResolvedValue([
      {
        id: 'whisperer',
        title: 'Called It',
        qbs: [{ id: 'x', name: 'Jayden Daniels', imageUrl: '' }],
      },
    ]);
    render(<QBWPage />);
    expect((await screen.findAllByText('Called It')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jayden Daniels').length).toBeGreaterThan(0);
    expect(screen.queryByText('The Whisperer')).toBeNull();
  });

  it('lets the admin add a QB to a shelf and saves every shelf', async () => {
    render(<QBWPage />);
    await screen.findByText('Josh Allen top 3');
    fireEvent.click(screen.getAllByLabelText("Edit Told You He's Garbage")[0]);
    fireEvent.click(screen.getByText('Add QB'));
    fireEvent.change(screen.getByLabelText('QB 3 name'), {
      target: { value: 'Zach Wilson' },
    });
    fireEvent.change(screen.getByLabelText('QB 3 prediction'), {
      target: { value: 'Bust' },
    });
    fireEvent.click(screen.getByText('Save Shelf'));

    await waitFor(() => expect(shelfHelpers.saveShelves).toHaveBeenCalled());
    const saved = shelfHelpers.saveShelves.mock.calls[0][0];
    expect(saved).toHaveLength(2);
    expect(saved[0]).toEqual(DEFAULT_SHELVES[0]);
    expect(saved[1].qbs.map((qb) => qb.name)).toEqual([
      'Kirk Cousins',
      'Russell Wilson',
      'Zach Wilson',
    ]);
    await waitFor(() => expect(screen.queryByText('Save Shelf')).toBeNull());
    expect(screen.getByText('8')).toBeTruthy();
  });

  it('keeps the editor open when the save is refused', async () => {
    shelfHelpers.saveShelves.mockRejectedValue({ code: 'permission-denied' });
    render(<QBWPage />);
    await screen.findByText('Josh Allen top 3');
    fireEvent.click(screen.getAllByLabelText('Edit The Whisperer')[0]);
    fireEvent.click(screen.getAllByLabelText('Remove Jared Goff')[0]);
    fireEvent.click(screen.getByText('Save Shelf'));
    await waitFor(() => expect(shelfHelpers.saveShelves).toHaveBeenCalled());
    expect(screen.getByText('Save Shelf')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
  });

  it('offers no visitor sign-in or editing to a non-admin', async () => {
    auth.isAdmin = false;
    render(<QBWPage />);
    await screen.findByText('Josh Allen top 3');
    expect(screen.queryByText('Login to Add Takes')).toBeNull();
    expect(screen.queryByText('Add Take')).toBeNull();
    expect(screen.queryByLabelText('Edit The Whisperer')).toBeNull();
  });
});
