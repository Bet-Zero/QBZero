import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// The ranker works out an order by asking about pairs. That order used to die
// on the results page -- exportable as an image, but reproducible on the board
// only by dragging thirty quarterbacks into place by hand.

const personal = vi.hoisted(() => ({
  getCurrentPersonalRanking: vi.fn(),
  saveCurrentPersonalRankings: vi.fn(async () => ({
    currentId: 'c',
    version: 2,
  })),
  getPreviousPersonalRanking: vi.fn(async () => null),
}));
vi.mock('@/firebase/personalRankingHelpers', () => personal);

const auth = vi.hoisted(() => ({ isAdmin: true }));
vi.mock('@/hooks/useAuth', () => ({
  default: () => ({
    ...auth,
    user: null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

const ranker = vi.hoisted(() => ({
  finalRanking: [
    { id: 'lamar-jackson', name: 'Lamar Jackson', team: 'BAL' },
    { id: 'josh-allen', name: 'Josh Allen', team: 'BUF' },
  ],
  comparisonResults: [],
  playerPool: [],
  resetRanker: vi.fn(),
  setFinalRanking: vi.fn(),
  generateShareableURL: vi.fn(() => ({ url: 'x' })),
  canNavigateToStep: vi.fn(() => true),
}));
vi.mock('@/context/RankerContext', () => ({
  useRankerContext: () => ranker,
  RankerProvider: ({ children }) => children,
}));

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const RankerResultsPage = (await import('@/pages/RankerResultsPage.jsx'))
  .default;

beforeEach(() => {
  vi.clearAllMocks();
  auth.isAdmin = true;
  personal.getCurrentPersonalRanking.mockResolvedValue({
    id: 'current',
    version: 1,
    rankings: [
      { id: 'josh-allen', name: 'Josh Allen', team: 'BUF', notes: 'cannon' },
    ],
  });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const renderResults = () =>
  render(
    <MemoryRouter>
      <RankerResultsPage />
    </MemoryRouter>
  );

describe('Ranker results → personal rankings', () => {
  it('saves the ranker order to the board, in order, keeping roster ids', async () => {
    renderResults();
    fireEvent.click(await screen.findByText(/Save to My Rankings/));

    await waitFor(() =>
      expect(personal.saveCurrentPersonalRankings).toHaveBeenCalled()
    );
    const [entries] = personal.saveCurrentPersonalRankings.mock.calls[0];
    expect(entries.map((e) => e.id)).toEqual(['lamar-jackson', 'josh-allen']);
    expect(entries.map((e) => e.rank)).toEqual([1, 2]);
  });

  it('carries existing notes across rather than dropping them with the old order', async () => {
    renderResults();
    fireEvent.click(await screen.findByText(/Save to My Rankings/));

    await waitFor(() =>
      expect(personal.saveCurrentPersonalRankings).toHaveBeenCalled()
    );
    const [entries] = personal.saveCurrentPersonalRankings.mock.calls[0];
    expect(entries.find((e) => e.id === 'josh-allen').notes).toBe('cannon');
    expect(entries.find((e) => e.id === 'lamar-jackson').notes).toBe('');
  });

  it('does nothing if the confirmation is declined', async () => {
    window.confirm.mockReturnValue(false);
    renderResults();
    fireEvent.click(await screen.findByText(/Save to My Rankings/));

    expect(personal.saveCurrentPersonalRankings).not.toHaveBeenCalled();
  });

  it('is not offered to a visitor, who could not write it anyway', async () => {
    auth.isAdmin = false;
    renderResults();
    await waitFor(() =>
      expect(screen.queryByText(/Start New Ranking/)).toBeTruthy()
    );
    expect(screen.queryByText(/Save to My Rankings/)).toBeNull();
  });
});
