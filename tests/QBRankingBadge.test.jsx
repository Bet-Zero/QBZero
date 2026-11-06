// The badge used to change shade by rank tier, and one tier was too pale for
// its white text. Every rank now gets the same dark badge.
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

const ranking = { rank: 1 };
vi.mock('@/hooks/useQBRanking', () => ({
  useQBRanking: () => ({ rank: ranking.rank, isLoading: false, error: null }),
}));

const { default: QBRankingBadge } = await import(
  '@/components/shared/QBRankingBadge'
);

const badgeClassFor = (rank) => {
  ranking.rank = rank;
  render(<QBRankingBadge playerId="x" playerName="X" />);
  const className = screen.getByTestId('qb-ranking-badge').className;
  cleanup();
  return className;
};

describe('QBRankingBadge', () => {
  it('looks the same at every rank', () => {
    const classes = [1, 8, 15, 25, 32].map(badgeClassFor);
    expect(new Set(classes).size).toBe(1);
  });

  it('shows the rank', () => {
    ranking.rank = 15;
    render(<QBRankingBadge playerId="x" playerName="X" />);
    expect(screen.getByText('#15')).toBeTruthy();
    cleanup();
  });
});
