import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Archives are never pruned -- every save keeps the board it replaced, for
// good. That only works if the read is bounded and the older ones are still
// reachable, rather than the list silently stopping at its page size.

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

const makeArchives = (count, offset = 0) =>
  Array.from({ length: count }, (_, i) => ({
    id: `archive-${offset + i}`,
    createdAt: { toDate: () => new Date(2026, 0, 100 - offset - i) },
    rankings: [{ id: 'a', name: 'Alpha', team: 'BUF' }],
  }));

const History = () => (
  <MemoryRouter>
    <RankingHistoryPage />
  </MemoryRouter>
);

// The timeline holds the live board plus one row per archive.
const timelineRows = () =>
  within(screen.getByRole('navigation', { name: 'Ranking versions' }))
    .getAllByRole('listitem')
    .filter((row) => !row.textContent.includes('Current'));

beforeEach(() => {
  vi.clearAllMocks();
  helpers.getCurrentPersonalRanking.mockResolvedValue({
    id: 'live',
    rankings: [{ id: 'a', name: 'Alpha', team: 'BUF' }],
  });
});
afterEach(cleanup);

describe('archive history paging', () => {
  it('offers the older ones when there are more than a page', async () => {
    helpers.getPersonalRankingArchives.mockResolvedValue({
      archives: makeArchives(50),
      hasMore: true,
    });

    render(<History />);
    expect(await screen.findByText('Load older rankings')).toBeTruthy();
  });

  it('says nothing when the whole history already fits', async () => {
    helpers.getPersonalRankingArchives.mockResolvedValue({
      archives: makeArchives(3),
      hasMore: false,
    });

    render(<History />);
    await waitFor(() =>
      expect(helpers.getPersonalRankingArchives).toHaveBeenCalled()
    );
    expect(screen.queryByText('Load older rankings')).toBeNull();
  });

  it('asks for a bigger page rather than dropping what is already shown', async () => {
    helpers.getPersonalRankingArchives.mockResolvedValueOnce({
      archives: makeArchives(50),
      hasMore: true,
    });
    render(<History />);

    helpers.getPersonalRankingArchives.mockResolvedValueOnce({
      archives: makeArchives(80),
      hasMore: false,
    });
    fireEvent.click(await screen.findByText('Load older rankings'));

    await waitFor(() =>
      expect(helpers.getPersonalRankingArchives).toHaveBeenLastCalledWith(100)
    );
    // All eighty are on screen, and there is nothing left to offer.
    await waitFor(() => expect(timelineRows().length).toBe(80));
    expect(screen.queryByText('Load older rankings')).toBeNull();
  });
});
