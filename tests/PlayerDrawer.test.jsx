import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlayerDrawer from '@/features/table/PlayerTable/PlayerRow/PlayerDrawer';

describe('PlayerDrawer overall blurb', () => {
  it('shows the overall summary written on the profile', () => {
    render(
      <PlayerDrawer player={{ blurbs: { overall: 'Elite processor.' } }} />
    );
    expect(screen.getByText('Elite processor.')).toBeTruthy();
  });

  it('draws no empty box when there is no summary', () => {
    // The stats panel has its own "Overall" label, so count against a player
    // with no blurbs at all rather than expecting zero.
    const countOverall = () => screen.queryAllByText('Overall').length;
    const { unmount } = render(<PlayerDrawer player={{}} />);
    const baseline = countOverall();
    unmount();

    render(<PlayerDrawer player={{ blurbs: { overall: '   ' } }} />);
    expect(countOverall()).toBe(baseline);
  });
});
