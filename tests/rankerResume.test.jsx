import {
  render,
  fireEvent,
  cleanup,
  within,
  act,
} from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RankingSession from '@/features/ranker/RankingSession.jsx';
import { RankerProvider, useRankerContext } from '@/context/RankerContext';
import { encodeRankerState } from '@/utils/ranker/rankerStateCodec';
import RankerComparisonsPage from '@/pages/RankerComparisonsPage';
import { quarterbacks } from '@/features/ranker/quarterbacks.js';

afterEach(cleanup);

const setup = {
  topTier: [],
  bottomTier: [],
  anchor: null,
  firstPlace: null,
  lastPlace: null,
};

const answered = (ui) =>
  Number(ui.getByTestId('progress-label').textContent.match(/^(\d+)/)[1]);

const pairText = (container) =>
  Array.from(container.querySelectorAll('.compare-button')).map(
    (b) => b.textContent
  );

const answerUntilDone = (container, onComplete, limit = 200) => {
  for (let i = 0; i < limit && !onComplete.mock.calls.length; i += 1) {
    const buttons = container.querySelectorAll('.compare-button');
    if (!buttons.length) break;
    fireEvent.click(buttons[1]);
  }
};

describe('RankingSession saves and resumes', () => {
  it('resumes at the same matchup with the same answers after a remount', () => {
    let saved = null;
    const onProgressChange = (p) => {
      saved = p;
    };
    const first = render(
      <RankingSession
        playerPool={quarterbacks}
        setupData={setup}
        onComplete={vi.fn()}
        onProgressChange={onProgressChange}
      />
    );
    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(first.container.querySelectorAll('.compare-button')[1]);
    }
    const before = pairText(first.container);
    first.unmount();

    const { container } = render(
      <RankingSession
        playerPool={quarterbacks}
        setupData={setup}
        onComplete={vi.fn()}
        savedProgress={saved}
        onProgressChange={onProgressChange}
      />
    );
    expect(answered(within(container))).toBe(3);
    expect(pairText(container)).toEqual(before);
  });

  it('ignores progress saved against a different setup', () => {
    let saved = null;
    const first = render(
      <RankingSession
        playerPool={quarterbacks}
        setupData={setup}
        onComplete={vi.fn()}
        onProgressChange={(p) => {
          saved = p;
        }}
      />
    );
    fireEvent.click(first.container.querySelectorAll('.compare-button')[1]);
    first.unmount();

    const { container } = render(
      <RankingSession
        playerPool={quarterbacks}
        setupData={{ ...setup, lastPlace: quarterbacks[0].id }}
        onComplete={vi.fn()}
        savedProgress={saved}
      />
    );
    expect(answered(within(container))).toBe(0);
  });

  it('reopens a finished session without recomputing it, and can undo into it', () => {
    const pool = quarterbacks.slice(0, 5);
    let saved = null;
    const onProgressChange = (p) => {
      saved = p;
    };
    const firstComplete = vi.fn();
    const first = render(
      <RankingSession
        playerPool={pool}
        setupData={setup}
        onComplete={firstComplete}
        onProgressChange={onProgressChange}
      />
    );
    answerUntilDone(first.container, firstComplete);
    expect(firstComplete).toHaveBeenCalledTimes(1);
    first.unmount();

    const onComplete = vi.fn();
    const onViewResults = vi.fn();
    const { container } = render(
      <RankingSession
        playerPool={pool}
        setupData={setup}
        onComplete={onComplete}
        onViewResults={onViewResults}
        savedProgress={saved}
        onProgressChange={onProgressChange}
      />
    );
    const ui = within(container);
    // Reopening must not overwrite the results page's ranking by itself.
    expect(onComplete).not.toHaveBeenCalled();
    expect(ui.getByText('All comparisons done')).toBeTruthy();

    fireEvent.click(ui.getByText('See results'));
    expect(onViewResults).toHaveBeenCalled();

    fireEvent.click(ui.getByText('Undo last pick'));
    expect(container.querySelectorAll('.compare-button')).toHaveLength(2);
    // A different answer can open new matchups, so answer until it finishes.
    answerUntilDone(container, onComplete);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe('RankingSession keyboard shortcuts', () => {
  const start = () => {
    const { container } = render(
      <RankingSession
        playerPool={quarterbacks}
        setupData={setup}
        onComplete={vi.fn()}
      />
    );
    return { container, ui: within(container) };
  };

  it('picks with the arrow keys and undoes with Z', () => {
    const { ui } = start();
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(answered(ui)).toBe(1);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(answered(ui)).toBe(2);
    fireEvent.keyDown(window, { key: 'z' });
    expect(answered(ui)).toBe(1);
  });

  it('skips with S', () => {
    const { container } = start();
    const before = pairText(container);
    fireEvent.keyDown(window, { key: 's' });
    expect(pairText(container)).not.toEqual(before);
  });

  it('ignores held-key repeats and keys typed into a field', () => {
    const { ui } = start();
    fireEvent.keyDown(window, { key: 'ArrowLeft', repeat: true });
    expect(answered(ui)).toBe(0);

    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'ArrowLeft' });
    expect(answered(ui)).toBe(0);
    input.remove();
  });
});

describe('RankerContext session progress', () => {
  beforeEach(() => localStorage.clear());

  const renderContext = (entry = '/ranker') => {
    const ref = {};
    const Probe = () => {
      Object.assign(ref, useRankerContext());
      return null;
    };
    render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route element={<RankerProvider />}>
            <Route path="/ranker" element={<Probe />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    return ref;
  };

  const storedProgress = () => {
    const key = Object.keys(localStorage).find((k) =>
      k.startsWith('ranker_session_progress_')
    );
    return key ? JSON.parse(localStorage.getItem(key)) : null;
  };

  const progress = {
    key: 'k',
    anchorResults: [],
    anchorDone: true,
    history: [
      { type: 'answer', winner: 'a', loser: 'b' },
      { type: 'skip', key: 'a|c' },
    ],
  };

  it('stores progress and survives a remount', () => {
    const ctx = renderContext();
    act(() => ctx.setSessionProgress(progress));
    expect(storedProgress()).toEqual(progress);

    cleanup();
    const again = renderContext();
    expect(again.sessionProgress).toEqual(progress);
  });

  it('undoes the last pick of the saved session', () => {
    const ctx = renderContext();
    act(() => ctx.setSessionProgress(progress));
    let undone;
    act(() => {
      undone = ctx.undoLastPick();
    });
    expect(undone).toBe(true);
    expect(storedProgress().history).toEqual([progress.history[0]]);
  });

  it('clears progress on reset', () => {
    const ctx = renderContext();
    act(() => ctx.setSessionProgress(progress));
    act(() => ctx.resetRanker());
    expect(ctx.sessionProgress).toBeNull();
    expect(storedProgress()).toBeNull();
  });

  it('does not write a shared link over the viewer’s own progress', () => {
    const ctx = renderContext();
    act(() => ctx.setSessionProgress(progress));
    cleanup();

    const pool = quarterbacks.slice(0, 3);
    const state = encodeRankerState({ playerPool: pool, setupData: setup });
    const shared = renderContext(`/ranker?state=${state}`);
    expect(shared.sessionProgress).toBeNull();
    act(() => shared.setSessionProgress({ ...progress, key: 'other' }));
    expect(storedProgress()).toEqual(progress);
  });
});

describe('Comparisons page across a reload', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('ranker_session_id', 's1');
    localStorage.setItem('ranker_player_pool_s1', JSON.stringify(quarterbacks));
    localStorage.setItem('ranker_setup_data_s1', JSON.stringify(setup));
  });

  const mountPage = () =>
    render(
      <MemoryRouter initialEntries={['/ranker/comparisons']}>
        <Routes>
          <Route element={<RankerProvider />}>
            <Route
              path="/ranker/comparisons"
              element={<RankerComparisonsPage />}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

  it('comes back with the answers already given', () => {
    // Saved state used to load in an effect, after a blank first render had
    // already saved an empty session over it.
    const first = mountPage();
    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(first.container.querySelectorAll('.compare-button')[1]);
    }
    const before = pairText(first.container);
    cleanup();

    const { container } = mountPage();
    expect(answered(within(container))).toBe(3);
    expect(pairText(container)).toEqual(before);
  });
});
