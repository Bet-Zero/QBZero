import '@testing-library/jest-dom/vitest';
import {
  render,
  screen,
  fireEvent,
  within,
  cleanup,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { quarterbacks } from '@/features/ranker/quarterbacks';
import { DEFAULT_POOL_IDS } from '@/features/ranker/defaultPool';
import {
  POOL_DEFAULT,
  POOL_ALL,
  buildPool,
  poolChoiceFor,
  restrictSetupToPool,
} from '@/utils/ranker/rankerPool';

const activeRoster = quarterbacks
  .filter((qb) => !qb.status)
  .map((qb) => ({ ...qb, status: 'active' }));

describe('buildPool', () => {
  it('trims the default to the curated starters and backups', () => {
    const pool = buildPool(activeRoster, POOL_DEFAULT);
    expect(pool.map((qb) => qb.id).sort()).toEqual(
      [...DEFAULT_POOL_IDS].sort()
    );
    expect(pool.length).toBeLessThan(activeRoster.length);
  });

  it('still offers every active quarterback', () => {
    expect(buildPool(activeRoster, POOL_ALL)).toBe(activeRoster);
  });

  it('drops a pooled quarterback once they retire', () => {
    const [retiring] = DEFAULT_POOL_IDS;
    const roster = activeRoster.filter((qb) => qb.id !== retiring);
    const ids = buildPool(roster, POOL_DEFAULT).map((qb) => qb.id);
    expect(ids).not.toContain(retiring);
    expect(ids).toHaveLength(DEFAULT_POOL_IDS.length - 1);
  });
});

describe('poolChoiceFor', () => {
  it('recognises a saved default pool', () => {
    expect(poolChoiceFor(buildPool(activeRoster, POOL_DEFAULT))).toBe(
      POOL_DEFAULT
    );
  });

  it('recognises a pool reaching past the default', () => {
    expect(poolChoiceFor(activeRoster)).toBe(POOL_ALL);
  });
});

describe('restrictSetupToPool', () => {
  it('drops selections for quarterbacks outside the pool', () => {
    const pool = [{ id: 'josh-allen' }, { id: 'bo-nix' }];
    expect(
      restrictSetupToPool(
        {
          topTier: ['josh-allen', 'kyle-allen'],
          bottomTier: ['zach-wilson'],
          anchor: 'jake-haener',
          firstPlace: 'josh-allen',
          lastPlace: 'tommy-devito',
        },
        pool
      )
    ).toEqual({
      topTier: ['josh-allen'],
      bottomTier: [],
      anchor: null,
      firstPlace: 'josh-allen',
      lastPlace: null,
    });
  });

  it('leaves a missing setup missing', () => {
    expect(restrictSetupToPool(null, [])).toBeNull();
  });
});

const context = {
  playerPool: [],
  setupData: null,
  sessionProgress: null,
  finalRanking: [],
  isSharedView: false,
  setPlayerPool: vi.fn(),
  setSetupData: vi.fn(),
  setSessionProgress: vi.fn(),
  setFinalRanking: vi.fn(),
  setComparisonResults: vi.fn(),
  leaveSharedView: vi.fn(),
  getSavedSession: vi.fn(),
};

vi.mock('@/context/RankerContext', () => ({
  useRankerContext: () => context,
}));
vi.mock('@/hooks/useQBRoster', () => ({
  default: () => ({ activeRoster, roster: activeRoster, loading: false }),
}));
vi.mock('@/components/ranker/RankerNavBar', () => ({ default: () => null }));

const RankerSetupPage = (await import('@/pages/RankerSetupPage')).default;

const renderPage = () =>
  render(
    <MemoryRouter>
      <RankerSetupPage />
    </MemoryRouter>
  );

const topTierNames = () =>
  within(screen.getByTestId('top-tier'))
    .getAllByRole('button')
    .map((b) => b.textContent);

describe('RankerSetupPage pool choice', () => {
  afterEach(cleanup);

  beforeEach(() => {
    context.playerPool = [];
    context.setupData = null;
    context.setPlayerPool.mockClear();
  });

  it('starts a new session on the default pool', () => {
    // Before this, a new session ranked every active quarterback.
    renderPage();
    expect(topTierNames()).toHaveLength(DEFAULT_POOL_IDS.length);
    expect(
      screen.getByRole('button', { name: /Default pool/ })
    ).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByText('Go'));
    expect(context.setPlayerPool.mock.calls[0][0]).toHaveLength(
      DEFAULT_POOL_IDS.length
    );
  });

  it('switches to every active quarterback on request', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Every active QB/ }));
    expect(topTierNames()).toHaveLength(activeRoster.length);

    fireEvent.click(screen.getByText('Go'));
    expect(context.setPlayerPool.mock.calls[0][0]).toHaveLength(
      activeRoster.length
    );
  });

  it('keeps a saved full-roster session on the full roster', () => {
    context.playerPool = activeRoster;
    renderPage();
    expect(topTierNames()).toHaveLength(activeRoster.length);
    expect(
      screen.getByRole('button', { name: /Every active QB/ })
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
