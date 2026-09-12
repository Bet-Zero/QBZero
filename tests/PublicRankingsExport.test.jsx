import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';

const rankings = [
  { id: 'josh-allen', name: 'Josh Allen', team: 'BUF' },
  { id: 'lamar-jackson', name: 'Lamar Jackson', team: 'BAL' },
];

vi.mock('@/firebase/personalRankingHelpers', () => ({
  getCurrentPersonalRanking: vi.fn().mockResolvedValue({
    rankings,
    updatedAt: new Date('2026-09-01').toISOString(),
  }),
  getArchivedPersonalRankings: vi.fn().mockResolvedValue([]),
}));

const PublicQBRankingsPage = (await import('@/pages/PublicQBRankingsPage'))
  .default;

afterEach(cleanup);

describe('public rankings page', () => {
  it('offers an export without requiring a sign-in', async () => {
    // The export modal only existed on /rankings/edit, which is admin-gated.
    // Once that gate became real authentication, downloading an image of
    // rankings that are already public needed an admin account.
    render(<PublicQBRankingsPage />);

    await waitFor(() => expect(screen.getByText('Josh Allen')).toBeTruthy());
    expect(
      screen.getByTitle('Download these rankings as an image')
    ).toBeTruthy();
  });

  it('shows no export button when there are no rankings', async () => {
    const helpers = await import('@/firebase/personalRankingHelpers');
    helpers.getCurrentPersonalRanking.mockResolvedValueOnce({ rankings: [] });

    render(<PublicQBRankingsPage />);

    await waitFor(() =>
      expect(screen.getByText(/No rankings available/)).toBeTruthy()
    );
    expect(screen.queryByText('Export')).toBeNull();
  });
});
