import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The history page is where every version of the personal rankings is read
// back: the board as it stood, what moved against the version before it (or
// any other), the note it was saved with, and one quarterback's path through
// all of them.

const helpers = vi.hoisted(() => ({
  getCurrentPersonalRanking: vi.fn(),
  getPersonalRankingArchives: vi.fn(),
  saveCurrentPersonalRankings: vi.fn(),
  deletePersonalRankingArchive: vi.fn(),
  ARCHIVE_PAGE_SIZE: 50,
}));
vi.mock('@/firebase/personalRankingHelpers', () => helpers);

const RankingHistoryPage = (await import('@/pages/RankingHistoryPage.jsx'))
  .default;
const { MemoryRouter } = await import('react-router-dom');
const { rankHistoryFor, rankRange } = await import(
  '@/utils/rankings/rankHistory.js'
);

const stamp = (m, d) => ({ toDate: () => new Date(2026, m - 1, d, 12) });
const qb = (id, name) => ({ id, name, team: 'X' });

const ALLEN = qb('josh-allen', 'Josh Allen');
const LAMAR = qb('lamar-jackson', 'Lamar Jackson');
const BURROW = qb('joe-burrow', 'Joe Burrow');
const HURTS = qb('jalen-hurts', 'Jalen Hurts');

const live = {
  id: 'live-doc',
  isCurrent: true,
  savedAt: stamp(9, 20),
  notes: 'Week 3 overreactions',
  rankings: [LAMAR, ALLEN, HURTS],
};
const archives = [
  {
    id: 'sep',
    savedAt: stamp(9, 1),
    createdAt: stamp(9, 20),
    notes: 'Preseason',
    rankings: [ALLEN, LAMAR, BURROW],
  },
  {
    id: 'aug',
    savedAt: stamp(8, 1),
    createdAt: stamp(9, 1),
    rankings: [BURROW, ALLEN, LAMAR],
  },
];

const renderAt = (path = '/rankings/history') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <RankingHistoryPage />
    </MemoryRouter>
  );

const board = () =>
  screen.getByRole('heading', { level: 2 }).closest('section');

beforeEach(() => {
  vi.clearAllMocks();
  helpers.getCurrentPersonalRanking.mockResolvedValue(live);
  helpers.getPersonalRankingArchives.mockResolvedValue({
    archives,
    hasMore: false,
  });
});
afterEach(cleanup);

describe('ranking history page', () => {
  it('opens on the current rankings, compared with the version they replaced', async () => {
    renderAt();
    expect(await screen.findByText('Current rankings')).toBeTruthy();
    expect(screen.getByText('Week 3 overreactions')).toBeTruthy();

    const section = board();
    // Hurts is new since September; Burrow was dropped.
    expect(within(section).getByText('NEW')).toBeTruthy();
    expect(
      within(section).getByText(/Not on this version: Joe Burrow/)
    ).toBeTruthy();
    expect(within(section).getByRole('combobox').value).toBe('sep');
  });

  it('opens a saved version from the link, with its dates and note', async () => {
    renderAt('/rankings/history?v=sep');
    expect(await screen.findByText('Saved ranking')).toBeTruthy();
    const section = board();
    expect(within(section).getByText(/Sep 1, 2026/)).toBeTruthy();
    expect(
      within(section).getByText(/current until Sep 20, 2026/)
    ).toBeTruthy();
    expect(within(section).getByText('Preseason')).toBeTruthy();
    expect(within(section).getByText('Restore')).toBeTruthy();
  });

  it('compares against any other version, not just the one before', async () => {
    renderAt();
    await screen.findByText('Current rankings');
    const section = board();

    // Against September: Lamar +1 is the riser.
    expect(within(section).getByText(/▲ Lamar Jackson \+1/)).toBeTruthy();

    // Against August: Lamar went from 3rd to 1st.
    fireEvent.change(within(section).getByRole('combobox'), {
      target: { value: 'aug' },
    });
    expect(
      await within(board()).findByText(/▲ Lamar Jackson \+2/)
    ).toBeTruthy();
  });

  it("shows one quarterback's rank across every version", async () => {
    renderAt();
    await screen.findByText('Current rankings');

    fireEvent.click(within(board()).getByText('Lamar Jackson'));
    expect(await screen.findByText(/On 3 of 3 versions loaded/)).toBeTruthy();
    expect(screen.getByRole('img', { name: /between 1 and 3/ })).toBeTruthy();
  });

  it('says so when nothing has been saved yet', async () => {
    helpers.getCurrentPersonalRanking.mockResolvedValue(null);
    helpers.getPersonalRankingArchives.mockResolvedValue({
      archives: [],
      hasMore: false,
    });
    renderAt();
    expect(await screen.findByText(/Nothing saved yet/)).toBeTruthy();
  });
});

describe('rank history', () => {
  it('runs oldest to newest, with a gap where he was off the board', () => {
    const points = rankHistoryFor(
      [
        { id: 'now', rankings: [LAMAR, ALLEN] },
        { id: 'mid', rankings: [ALLEN] },
        { id: 'old', rankings: [ALLEN, LAMAR] },
      ],
      LAMAR
    );
    expect(points.map((p) => [p.id, p.rank])).toEqual([
      ['old', 2],
      ['mid', null],
      ['now', 1],
    ]);
    expect(rankRange(points)).toEqual({ best: 1, worst: 2 });
  });

  it('follows him by name across the old generated ids', () => {
    const points = rankHistoryFor(
      [
        { id: 'now', rankings: [LAMAR] },
        { id: 'old', rankings: [{ id: 'qb-1-2-x', name: 'Lamar Jackson' }] },
      ],
      LAMAR
    );
    expect(points.map((p) => p.rank)).toEqual([1, 1]);
  });
});
