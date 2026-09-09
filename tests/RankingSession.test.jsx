import { render, fireEvent, cleanup, within } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import RankingSession from '@/features/ranker/RankingSession.jsx';
import { quarterbacks } from '@/features/ranker/quarterbacks.js';

// vitest.config.js does not enable `globals`, so testing-library's automatic
// cleanup is not registered. Without this, renders pile up in the same document
// and queries match nodes from earlier tests.
afterEach(cleanup);

const emptySetup = {
  topTier: [],
  bottomTier: [],
  anchor: null,
  firstPlace: null,
  lastPlace: null,
};

// The progress label renders as "{answered} of ~{total} comparisons".
const readProgress = (ui) => {
  const label = ui.getByTestId('progress-label');
  const [, answered, total] = label.textContent.match(
    /(-?\d+) of ~(-?\d+) comparisons/
  );
  return { answered: Number(answered), total: Number(total) };
};

const barWidth = (ui) => parseFloat(ui.getByTestId('progress-bar').style.width);

// Click whichever compare button is NOT the one the estimator assumes wins.
// This is the answer pattern that used to drive the counter negative.
const answerSecond = (container) => {
  const buttons = container.querySelectorAll('.compare-button');
  fireEvent.click(buttons[1]);
};

const compareButtons = (container) =>
  Array.from(container.querySelectorAll('.compare-button')).map(
    (b) => b.textContent
  );

const start = (props) => {
  const { container } = render(
    <RankingSession
      playerPool={quarterbacks}
      setupData={emptySetup}
      onComplete={vi.fn()}
      {...props}
    />
  );
  return { container, ui: within(container) };
};

describe('RankingSession progress reporting', () => {
  it('never reports negative or out-of-range progress', () => {
    const { container, ui } = start();

    const seen = [];
    for (let i = 0; i < 10; i += 1) {
      const { answered, total } = readProgress(ui);
      const width = barWidth(ui);
      seen.push({ answered, total, width });

      expect(answered).toBeGreaterThanOrEqual(0);
      expect(total).toBeGreaterThanOrEqual(answered);
      expect(width).toBeGreaterThanOrEqual(0);
      expect(width).toBeLessThanOrEqual(100);

      answerSecond(container);
    }

    // Answers are actually being recorded, not just clamped to zero.
    expect(seen[0].answered).toBe(0);
    expect(seen[seen.length - 1].answered).toBe(seen.length - 1);
  });

  it('never moves the progress bar backwards', () => {
    const { container, ui } = start();

    let previous = barWidth(ui);
    for (let i = 0; i < 10; i += 1) {
      answerSecond(container);
      const width = barWidth(ui);
      expect(width).toBeGreaterThanOrEqual(previous);
      previous = width;
    }
  });
});

describe('RankingSession skip and undo', () => {
  it('skip advances to a different matchup', () => {
    const { container, ui } = start();

    const before = compareButtons(container);
    fireEvent.click(ui.getByText('Skip'));

    expect(compareButtons(container)).not.toEqual(before);
  });

  it('undo restores a skipped matchup', () => {
    const { container, ui } = start();

    const before = compareButtons(container);
    fireEvent.click(ui.getByText('Skip'));
    expect(compareButtons(container)).not.toEqual(before);

    fireEvent.click(ui.getByText('Undo'));
    expect(compareButtons(container)).toEqual(before);
  });

  it('undo does not eat lock-in comparisons', () => {
    const { container, ui } = start({
      setupData: { ...emptySetup, firstPlace: 'josh-allen' },
    });

    // Undo with no user actions recorded is a no-op rather than removing a
    // seeded lock-in comparison.
    expect(readProgress(ui).answered).toBe(0);
    fireEvent.click(ui.getByText('Undo'));
    expect(readProgress(ui).answered).toBe(0);

    answerSecond(container);
    expect(readProgress(ui).answered).toBe(1);
    fireEvent.click(ui.getByText('Undo'));
    expect(readProgress(ui).answered).toBe(0);
  });
});

describe('RankingSession lock-ins', () => {
  it('places a first-place lock-in at rank 1 in the final ranking', () => {
    const onComplete = vi.fn();
    const pool = quarterbacks.slice(0, 6);
    const { container } = render(
      <RankingSession
        playerPool={pool}
        setupData={{ ...emptySetup, firstPlace: pool[4].id }}
        onComplete={onComplete}
      />
    );

    for (let i = 0; i < 80 && !onComplete.mock.calls.length; i += 1) {
      if (!container.querySelector('.compare-button')) break;
      answerSecond(container);
    }

    expect(onComplete).toHaveBeenCalled();
    const [ranking] = onComplete.mock.calls[0];
    expect(ranking.filter(Boolean)).toHaveLength(pool.length);
    expect(ranking[0].id).toBe(pool[4].id);
  });
});
