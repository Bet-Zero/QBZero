import '@testing-library/jest-dom/vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
  waitFor,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { quarterbacks } from '@/features/ranker/quarterbacks';
import { encodeRankerState } from '@/utils/ranker/rankerStateCodec';
import { sessionProgressKey } from '@/features/ranker/RankingSession';

// The ranker's session lives in the viewer's browser and nowhere else, so
// anything that clears it, or writes someone else's session over it, cannot be
// taken back.

vi.mock('@/firebase/personalRankingHelpers', () => ({
  getCurrentPersonalRanking: vi.fn(async () => null),
  saveCurrentPersonalRankings: vi.fn(),
}));
vi.mock('@/hooks/useAuth', () => ({
  default: () => ({ isAdmin: false, user: null, loading: false }),
}));
vi.mock('@/hooks/useQBRoster', () => ({
  default: () => ({
    roster: quarterbacks,
    activeRoster: quarterbacks,
    loading: false,
  }),
}));

const { RankerProvider, useRankerContext } = await import(
  '@/context/RankerContext'
);
const RankerLandingPage = (await import('@/pages/RankerLandingPage')).default;
const RankerSetupPage = (await import('@/pages/RankerSetupPage')).default;
const RankerResultsPage = (await import('@/pages/RankerResultsPage')).default;

const pool = quarterbacks.slice(0, 6);
const setup = {
  topTier: [],
  bottomTier: [],
  anchor: null,
  firstPlace: null,
  lastPlace: null,
};
const progress = {
  key: sessionProgressKey(pool, setup),
  anchorResults: [],
  anchorDone: true,
  history: [
    { type: 'answer', winner: pool[0].id, loser: pool[1].id },
    { type: 'answer', winner: pool[2].id, loser: pool[3].id },
    { type: 'answer', winner: pool[4].id, loser: pool[5].id },
  ],
};

const stored = (key) => {
  const raw = localStorage.getItem(`ranker_${key}_s1`);
  return raw ? JSON.parse(raw) : null;
};

const seedSession = ({ withResults = false } = {}) => {
  localStorage.setItem('ranker_session_id', 's1');
  localStorage.setItem('ranker_player_pool_s1', JSON.stringify(pool));
  localStorage.setItem('ranker_setup_data_s1', JSON.stringify(setup));
  localStorage.setItem('ranker_session_progress_s1', JSON.stringify(progress));
  if (withResults) {
    localStorage.setItem('ranker_final_ranking_s1', JSON.stringify(pool));
  }
};

const location = {};
const LocationProbe = () => {
  Object.assign(location, useLocation());
  return null;
};
const context = {};
const ContextProbe = () => {
  Object.assign(context, useRankerContext());
  return null;
};

const renderRanker = (entry) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <LocationProbe />
      <Routes>
        <Route element={<RankerProvider />}>
          <Route path="/ranker" element={<RankerLandingPage />} />
          <Route path="/ranker/setup" element={<RankerSetupPage />} />
          <Route path="/ranker/comparisons" element={<ContextProbe />} />
          <Route path="/ranker/results" element={<RankerResultsPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn();
});
afterEach(cleanup);

describe('starting over asks first', () => {
  it('keeps finished results when the person backs out', async () => {
    seedSession({ withResults: true });
    renderRanker('/ranker/results');

    fireEvent.click(screen.getByText(/Start New Ranking/));
    expect(await screen.findByText('Start a new ranking?')).toBeVisible();
    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() =>
      expect(screen.queryByText('Start a new ranking?')).toBeNull()
    );
    expect(stored('final_ranking')).toHaveLength(pool.length);
    expect(location.pathname).toBe('/ranker/results');
  });

  it('clears the session once confirmed', async () => {
    seedSession({ withResults: true });
    renderRanker('/ranker/results');

    fireEvent.click(screen.getByText(/Start New Ranking/));
    fireEvent.click(await screen.findByText('Start over'));

    await waitFor(() => expect(location.pathname).toBe('/ranker'));
    expect(stored('final_ranking')).toBeNull();
  });

  it('makes the home page’s New Ranking Session actually start a new one', async () => {
    seedSession();
    renderRanker('/ranker');

    fireEvent.click(screen.getByText(/New Ranking Session/));
    fireEvent.click(await screen.findByText('Start over'));

    await waitFor(() => expect(location.pathname).toBe('/ranker/setup'));
    expect(localStorage.getItem('ranker_session_id')).not.toBe('s1');
    expect(stored('session_progress')).toBeNull();
  });
});

describe('changing the setup', () => {
  it('goes straight on when nothing changed', async () => {
    seedSession();
    renderRanker('/ranker/setup');

    fireEvent.click(screen.getByText('Update & Continue'));

    await waitFor(() => expect(location.pathname).toBe('/ranker/comparisons'));
    expect(screen.queryByText('Start your comparisons over?')).toBeNull();
    expect(stored('session_progress')).toEqual(progress);
  });

  it('says the picks will be lost before discarding them', async () => {
    seedSession({ withResults: true });
    renderRanker('/ranker/setup');

    fireEvent.click(screen.getAllByText(pool[0].name)[0]); // top tier
    fireEvent.click(screen.getByText('Update & Continue'));

    expect(
      await screen.findByText(/Your 3 picks were made against a different/)
    ).toBeVisible();
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() =>
      expect(screen.queryByText('Start your comparisons over?')).toBeNull()
    );
    expect(location.pathname).toBe('/ranker/setup');
    expect(stored('session_progress')).toEqual(progress);

    fireEvent.click(screen.getByText('Update & Continue'));
    fireEvent.click(await screen.findByText('Start over'));

    await waitFor(() => expect(location.pathname).toBe('/ranker/comparisons'));
    expect(stored('setup_data').topTier).toEqual([pool[0].id]);
    // The old results no longer match the setup, so they go with the picks.
    expect(stored('final_ranking')).toEqual([]);
    expect(stored('session_progress')).toBeNull();
  });
});

describe('a shared results link', () => {
  const sharedPool = quarterbacks.slice(10, 14);
  const link = () =>
    `/ranker/results?state=${encodeRankerState({
      playerPool: sharedPool,
      setupData: setup,
      finalRanking: sharedPool,
    })}`;

  it('is labelled as someone else’s and cannot clear the viewer’s session', () => {
    seedSession();
    renderRanker(link());

    expect(screen.getByText('Shared QB Rankings')).toBeVisible();
    expect(screen.queryByText(/Start New Ranking/)).toBeNull();
    expect(screen.getByText('Rank them yourself')).toBeVisible();
  });

  it('never saves its results over the viewer’s own', async () => {
    seedSession({ withResults: true });
    renderRanker(link());

    // Adjusting the shared ranking goes through the same setter.
    fireEvent.click(screen.getByText(/Adjust Rankings/));
    fireEvent.click(screen.getAllByTitle('Move down')[0]);
    fireEvent.click(await screen.findByText('Save Adjustments'));

    expect(stored('final_ranking').map((p) => p.id)).toEqual(
      pool.map((p) => p.id)
    );
  });

  it('hands back the viewer’s own session from "Rank them yourself"', async () => {
    seedSession();
    renderRanker(link());

    fireEvent.click(screen.getByText('Rank them yourself'));

    await waitFor(() => expect(location.pathname).toBe('/ranker'));
    expect(screen.getByText(/Continue Comparisons/)).toBeVisible();
    expect(stored('session_progress')).toEqual(progress);
  });

  it('becomes the viewer’s own once they confirm its setup', async () => {
    seedSession();
    renderRanker(link().replace('/results', '/setup'));

    fireEvent.click(screen.getByText('Update & Continue'));
    fireEvent.click(await screen.findByText('Start over'));

    await waitFor(() => expect(location.pathname).toBe('/ranker/comparisons'));
    expect(stored('player_pool').map((p) => p.id)).toEqual(
      sharedPool.map((p) => p.id)
    );
    expect(stored('session_progress')).toBeNull();
    expect(context.isSharedView).toBe(false);
  });
});

it('opens each ranker step at the top of the page', async () => {
  seedSession({ withResults: true });
  renderRanker('/ranker');
  window.scrollTo.mockClear();

  await act(async () => {
    fireEvent.click(screen.getByText(/View Your Results/));
  });
  expect(location.pathname).toBe('/ranker/results');
  expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
});
