import {
  render,
  screen,
  fireEvent,
  within,
  cleanup,
} from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { RankingSetup } from '@/features/ranker/RankingSetup.jsx';

const samplePlayers = [
  { id: '1', display_name: 'Alpha' },
  { id: '2', display_name: 'Beta' },
];

describe('RankingSetup', () => {
  it('captures selections and submits', () => {
    const handle = vi.fn();
    render(<RankingSetup playerPool={samplePlayers} onComplete={handle} />);
    const top = screen.getByTestId('top-tier');
    fireEvent.click(within(top).getByText('Alpha'));
    fireEvent.click(screen.getByText('Go'));
    expect(handle).toHaveBeenCalledWith({
      topTier: ['1'],
      bottomTier: [],
      anchor: null,
      firstPlace: null,
      lastPlace: null,
    });
  });
});

describe('RankingSetup validation', () => {
  const pool = [
    { id: '1', display_name: 'Alpha' },
    { id: '2', display_name: 'Beta' },
    { id: '3', display_name: 'Gamma' },
    { id: '4', display_name: 'Delta' },
  ];

  afterEach(cleanup);

  it('moves a player out of the bottom tier when added to the top tier', () => {
    const handle = vi.fn();
    const { container } = render(
      <RankingSetup playerPool={pool} onComplete={handle} />
    );
    const ui = within(container);

    const bottom = ui.getByTestId('bottom-tier');
    fireEvent.click(within(bottom).getByText('Alpha'));

    const top = ui.getByTestId('top-tier');
    fireEvent.click(within(top).getByText('Alpha'));

    fireEvent.click(ui.getByText('Go'));
    const submitted = handle.mock.calls[0][0];
    expect(submitted.topTier).toEqual(['1']);
    expect(submitted.bottomTier).toEqual([]);
  });

  it('normalises contradictory restored setup data', () => {
    const handle = vi.fn();
    const { container } = render(
      <RankingSetup
        playerPool={pool}
        onComplete={handle}
        existingSetupData={{
          topTier: ['1', '2'],
          bottomTier: ['2', '3'],
          anchor: '1',
          firstPlace: '3',
          lastPlace: '3',
        }}
      />
    );

    fireEvent.click(within(container).getByText('Update & Continue'));
    const submitted = handle.mock.calls[0][0];

    // '2' cannot be in both tiers; top tier wins.
    expect(submitted.topTier).toContain('2');
    expect(submitted.bottomTier).not.toContain('2');
    // The anchor was also a top-tier member, so it is dropped.
    expect(submitted.anchor).toBeNull();
    // The same player cannot be locked into both ends.
    expect(submitted.lastPlace).toBeNull();
    expect(submitted.firstPlace).toBe('3');
    // '3' was locked to first place, so it cannot stay in the bottom tier.
    expect(submitted.bottomTier).not.toContain('3');
  });

  it('caps tier selection and reports it instead of silently ignoring clicks', () => {
    const handle = vi.fn();
    // 4 players => cap of 1.
    const { container } = render(
      <RankingSetup playerPool={pool} onComplete={handle} />
    );
    const ui = within(container);
    const top = within(ui.getByTestId('top-tier'));

    fireEvent.click(top.getByText('Alpha'));
    expect(ui.getByText(/Top tier is full/)).toBeTruthy();
    expect(top.getByText('Beta').disabled).toBe(true);

    fireEvent.click(top.getByText('Beta'));
    fireEvent.click(ui.getByText('Go'));
    expect(handle.mock.calls[0][0].topTier).toEqual(['1']);
  });
});
