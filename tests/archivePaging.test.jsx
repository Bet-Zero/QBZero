import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
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

const ArchiveSidebar = (await import('@/features/rankings/ArchiveSidebar.jsx'))
  .default;
const usePersonalRankingHistory = (
  await import('@/hooks/usePersonalRankingHistory.js')
).default;

const makeArchives = (count, offset = 0) =>
  Array.from({ length: count }, (_, i) => ({
    id: `archive-${offset + i}`,
    createdAt: { toDate: () => new Date(2026, 0, 100 - offset - i) },
    rankings: [{ id: 'a', name: 'Alpha', team: 'BUF' }],
  }));

// A component that exercises the hook the way both history pages do.
const History = () => {
  const {
    archives,
    hasMore,
    loadMore,
    loadingMore,
    selectedArchive,
    setSelectedArchive,
  } = usePersonalRankingHistory();
  return (
    <ArchiveSidebar
      archives={archives}
      selectedId={selectedArchive?.id}
      onSelect={setSelectedArchive}
      hasMore={hasMore}
      onLoadMore={loadMore}
      loadingMore={loadingMore}
    />
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  helpers.getCurrentPersonalRanking.mockResolvedValue({
    id: 'live',
    rankings: [],
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
    expect(await screen.findByText('Load older archives')).toBeTruthy();
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
    expect(screen.queryByText('Load older archives')).toBeNull();
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
    fireEvent.click(await screen.findByText('Load older archives'));

    await waitFor(() =>
      expect(helpers.getPersonalRankingArchives).toHaveBeenLastCalledWith(100)
    );
    // All eighty are on screen, and there is nothing left to offer.
    await waitFor(() =>
      expect(screen.getAllByText(/QBs ranked/).length).toBe(80)
    );
    expect(screen.queryByText('Load older archives')).toBeNull();
  });
});
