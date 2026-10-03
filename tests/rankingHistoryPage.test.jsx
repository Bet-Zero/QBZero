import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
  waitFor,
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
  getNoteHistory: vi.fn(async () => []),
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
    expect(
      within(section).getByText(/Biggest rise: Lamar Jackson, up 1 spot/)
    ).toBeTruthy();

    // Against August: Lamar went from 3rd to 1st.
    fireEvent.change(within(section).getByRole('combobox'), {
      target: { value: 'aug' },
    });
    expect(
      await within(board()).findByText(
        /Biggest rise: Lamar Jackson, up 2 spots/
      )
    ).toBeTruthy();
  });

  it("shows one quarterback's rank across every version", async () => {
    renderAt();
    await screen.findByText('Current rankings');

    fireEvent.click(within(board()).getByText('Lamar Jackson'));
    expect(await screen.findByText(/On 3 of 3 versions loaded/)).toBeTruthy();
    // Dated along the bottom, so the span reads at a glance.
    const chart = screen.getByRole('img', {
      name: /Aug 1 to Sep 20, between 1 and 3/,
    });
    expect(within(chart).getByText('Aug 1')).toBeTruthy();
    expect(within(chart).getByText('Sep 20')).toBeTruthy();
  });

  it('keeps a notepad of every note he has had, newest first', async () => {
    helpers.getNoteHistory.mockResolvedValue([
      { qbId: 'lamar-jackson', notes: 'Best player alive', at: stamp(9, 25) },
    ]);
    const withNotes = (entry, text) => ({
      ...entry,
      rankings: entry.rankings.map((q) =>
        q.id === 'lamar-jackson' ? { ...q, notes: text } : q
      ),
    });
    helpers.getCurrentPersonalRanking.mockResolvedValue(
      withNotes(live, 'Best player alive')
    );
    helpers.getPersonalRankingArchives.mockResolvedValue({
      archives: [
        withNotes(archives[0], 'MVP form'),
        withNotes(archives[1], 'Health is the question'),
      ],
      hasMore: false,
    });

    renderAt('/rankings/history?qb=lamar-jackson');
    await screen.findByText('Notes history');
    expect(helpers.getNoteHistory).toHaveBeenCalledWith('lamar-jackson');

    const notepad = (await screen.findByText('Notes history')).closest(
      'div'
    ).parentElement;
    await waitFor(() =>
      expect(within(notepad).getAllByRole('listitem').length).toBe(3)
    );
    const texts = within(notepad)
      .getAllByRole('listitem')
      .map((item) => item.lastChild.textContent);
    expect(texts).toEqual([
      'Best player alive',
      'MVP form',
      'Health is the question',
    ]);
    // The edit is dated when it was written, not when its board was saved.
    expect(screen.getByText(/Sep 25, 2026 · latest/)).toBeTruthy();
  });

  it('labels each timeline row in words', async () => {
    renderAt();
    await screen.findByText('Current rankings');
    const timeline = screen.getByRole('navigation', {
      name: 'Ranking versions',
    });
    expect(within(timeline).getByText(/Since Sep 20, 2026/)).toBeTruthy();
    expect(
      within(timeline).getByText('Sep 1, 2026 – Sep 20, 2026')
    ).toBeTruthy();
    expect(
      within(timeline).getByText('Biggest drop: Josh Allen, down 1 spot')
    ).toBeTruthy();
    expect(within(timeline).getByText('Added 1 QB')).toBeTruthy();
  });

  it('asks in an in-app dialog before restoring, not a browser popup', async () => {
    const browserConfirm = vi.spyOn(window, 'confirm');
    helpers.saveCurrentPersonalRankings.mockResolvedValue({ version: 2 });
    renderAt('/rankings/history?v=sep');
    fireEvent.click(await screen.findByText('Restore'));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Restore this version?')).toBeTruthy();
    expect(browserConfirm).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Restore' }));
    await waitFor(() =>
      expect(helpers.saveCurrentPersonalRankings).toHaveBeenCalled()
    );
    browserConfirm.mockRestore();
  });

  it('deletes nothing when the dialog is cancelled', async () => {
    renderAt('/rankings/history?v=sep');
    fireEvent.click(await screen.findByText('Delete'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Delete this version?')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(helpers.deletePersonalRankingArchive).not.toHaveBeenCalled();
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
