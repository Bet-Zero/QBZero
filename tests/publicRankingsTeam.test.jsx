// The public board used to show each quarterback's team as copied into the
// saved ranking, so a team changed on a profile never reached it.
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/firebase/personalRankingHelpers', () => ({
  getCurrentPersonalRanking: vi.fn(async () => ({
    rankings: [{ id: 'j-j-mccarthy', name: 'J.J. McCarthy', team: 'MIN' }],
  })),
}));

vi.mock('@/hooks/usePersonalRankingMovement', () => ({
  default: () => ({}),
}));

vi.mock('@/hooks/useQBRoster', () => ({
  default: () => ({
    roster: [{ id: 'j-j-mccarthy', name: 'J.J. McCarthy', team: 'NYG' }],
    activeRoster: [],
    loading: false,
  }),
}));

const PublicQBRankingsPage = (await import('@/pages/PublicQBRankingsPage.jsx'))
  .default;

describe('the public rankings page', () => {
  it("shows a quarterback's current team, not the one saved with the board", async () => {
    render(<PublicQBRankingsPage />);
    expect(await screen.findAllByText('NYG')).not.toHaveLength(0);
    expect(screen.queryByText('MIN')).toBeNull();
  });
});
