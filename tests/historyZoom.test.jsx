import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
  waitFor,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Once there are years of saved rankings, scrolling them one at a time is
// hopeless. The timeline steps out to months and years, photo-library style,
// and steps back in to the period that was picked.

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
const { groupByMonth, groupByYear } = await import(
  '@/utils/rankings/historyGroups.js'
);

const at = (y, m, d) => ({ toDate: () => new Date(y, m - 1, d, 12) });
const board = (leader) => [
  { id: leader, name: leader },
  { id: 'other', name: 'Other' },
];
const version = (id, y, m, d, leader = 'Josh Allen') => ({
  id,
  savedAt: at(y, m, d),
  createdAt: at(y, m, d + 1),
  rankings: board(leader),
});

const archives = [
  version('sep-b', 2026, 9, 20, 'Lamar Jackson'),
  version('sep-a', 2026, 9, 5),
  version('aug', 2026, 8, 10),
  version('dec-25', 2025, 12, 1, 'Joe Burrow'),
  version('mar-25', 2025, 3, 1),
];

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/rankings/history']}>
      <RankingHistoryPage />
    </MemoryRouter>
  );

const timeline = () =>
  screen.getByRole('navigation', { name: 'Ranking versions' });

beforeEach(() => {
  vi.clearAllMocks();
  helpers.getCurrentPersonalRanking.mockResolvedValue({
    id: 'live',
    savedAt: at(2026, 9, 28),
    rankings: board('Lamar Jackson'),
  });
  helpers.getPersonalRankingArchives.mockResolvedValue({
    archives,
    hasMore: false,
  });
});
afterEach(cleanup);

describe('filing versions by period', () => {
  it('groups by month and by year, newest first', () => {
    const months = groupByMonth(archives);
    expect(months.map((m) => [m.label, m.entries.length])).toEqual([
      ['September 2026', 2],
      ['August 2026', 1],
      ['December 2025', 1],
      ['March 2025', 1],
    ]);
    const years = groupByYear(archives);
    expect(years.map((y) => [y.label, y.total])).toEqual([
      ['2026', 3],
      ['2025', 2],
    ]);
    expect(years[1].counts[11]).toBe(1); // December
    expect(years[1].counts[2]).toBe(1); // March
  });
});

describe('timeline zoom', () => {
  it('files the full list under month headings', async () => {
    renderPage();
    await screen.findByText('Current rankings');
    const headings = within(timeline())
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(headings).toEqual([
      'September 2026',
      'August 2026',
      'December 2025',
      'March 2025',
    ]);
  });

  it('steps out to years, then in to a month and its newest version', async () => {
    renderPage();
    await screen.findByText('Current rankings');

    fireEvent.click(within(timeline()).getByRole('tab', { name: 'Years' }));
    expect(within(timeline()).getByText('2025')).toBeTruthy();
    expect(
      within(timeline()).getByText('No. 1 at the end: Joe Burrow')
    ).toBeTruthy();

    // December 2025 on the year's month strip.
    fireEvent.click(
      within(timeline()).getByRole('button', {
        name: 'December 2025, 1 version',
      })
    );

    // Back in the full list, with that month's version open.
    expect(
      within(timeline())
        .getByRole('tab', { name: 'All' })
        .getAttribute('aria-selected')
    ).toBe('true');
    expect(await screen.findByText('Saved ranking')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(
      /Dec 1, 2025/
    );
  });

  it('steps from a year to its months', async () => {
    renderPage();
    await screen.findByText('Current rankings');
    fireEvent.click(within(timeline()).getByRole('tab', { name: 'Years' }));
    fireEvent.click(within(timeline()).getByText('2026'));

    expect(
      within(timeline())
        .getByRole('tab', { name: 'Months' })
        .getAttribute('aria-selected')
    ).toBe('true');
    expect(within(timeline()).getByText('August 2026')).toBeTruthy();
    expect(
      within(timeline()).getAllByText(/3 versions|2 versions/).length
    ).toBeGreaterThan(0);
  });

  it('reads the whole history before filing it, not just the loaded page', async () => {
    helpers.getPersonalRankingArchives.mockResolvedValue({
      archives,
      hasMore: true,
    });
    renderPage();
    await screen.findByText('Current rankings');

    fireEvent.click(within(timeline()).getByRole('tab', { name: 'Months' }));
    await waitFor(() =>
      expect(helpers.getPersonalRankingArchives).toHaveBeenLastCalledWith(2000)
    );
  });
});
