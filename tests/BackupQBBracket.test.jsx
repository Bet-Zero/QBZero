import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {
  fetchBracketPicks,
  saveBracketPicks,
} from '@/firebase/backupBracketHelpers';
import BackupQBBracket, {
  BRACKET_STORAGE_KEY,
} from '@/features/backupBracket/BackupQBBracket.jsx';

vi.mock('@/firebase/backupBracketHelpers', () => ({
  fetchBracketPicks: vi.fn(),
  saveBracketPicks: vi.fn(),
}));

const createEntrants = (count) =>
  Array.from({ length: count }, (_, index) => ({
    id: `qb-${index + 1}`,
    display_name: `QB ${index + 1}`,
    team: `T${index + 1}`,
  }));

// The newest (rightmost) button for a QB: the one in the latest round they
// have reached.
const pickButton = (name) => {
  const buttons = screen.getAllByRole('button', {
    name: `Select ${name} as winner`,
  });
  return buttons[buttons.length - 1];
};

describe('BackupQBBracket component', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(fetchBracketPicks).mockReset().mockResolvedValue(null);
    vi.mocked(saveBracketPicks).mockReset().mockResolvedValue(undefined);
  });
  afterEach(cleanup);

  it('allows selecting and clearing winners', () => {
    render(
      <BackupQBBracket entrants={createEntrants(16)} preferredSize={16} />
    );
    const before = screen.getAllByText('Winner of Match 1').length;

    // Seeds 1 and 16 meet in the first match; QB 1 sorts first and QB 16 last.
    fireEvent.click(pickButton('QB 1'));
    expect(screen.getAllByText('Winner of Match 1')).toHaveLength(before - 1);
    expect(pickButton('QB 1')).toHaveAttribute('aria-pressed', 'false');
    expect(
      screen.getAllByRole('button', { name: 'Select QB 1 as winner' })
    ).toHaveLength(2);

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Select QB 1 as winner' })[0]
    );
    expect(screen.getAllByText('Winner of Match 1')).toHaveLength(before);
  });

  it('keeps picks after a reload', () => {
    const entrants = createEntrants(8);
    const { unmount } = render(
      <BackupQBBracket entrants={entrants} preferredSize={8} />
    );
    fireEvent.click(pickButton('QB 1'));
    unmount();
    expect(window.localStorage.getItem(BRACKET_STORAGE_KEY)).toContain('qb-1');

    render(<BackupQBBracket entrants={[...entrants]} preferredSize={8} />);
    expect(
      screen.getAllByRole('button', { name: 'Select QB 1 as winner' })
    ).toHaveLength(2);
  });

  it('drops saved picks for players no longer in the bracket', () => {
    window.localStorage.setItem(
      BRACKET_STORAGE_KEY,
      JSON.stringify({ winners: [['gone', null], [null]] })
    );
    render(<BackupQBBracket entrants={createEntrants(4)} preferredSize={4} />);
    expect(screen.queryByRole('button', { pressed: true })).toBeNull();
  });

  it('asks in the page before resetting picks', async () => {
    render(<BackupQBBracket entrants={createEntrants(4)} preferredSize={4} />);
    fireEvent.click(pickButton('QB 1'));
    fireEvent.click(screen.getByRole('button', { name: 'Reset Bracket' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(
      screen.getAllByRole('button', { name: 'Select QB 1 as winner' })
    ).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Reset Bracket' }));
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Reset',
      })
    );
    await waitFor(() =>
      expect(
        screen.getAllByRole('button', { name: 'Select QB 1 as winner' })
      ).toHaveLength(1)
    );
  });

  it('loads picks saved to the account over this browser', async () => {
    window.localStorage.setItem(
      BRACKET_STORAGE_KEY,
      JSON.stringify({ winners: [['qb-1', null], [null]] })
    );
    vi.mocked(fetchBracketPicks).mockResolvedValue([[null, 'qb-2'], [null]]);
    render(<BackupQBBracket entrants={createEntrants(4)} preferredSize={4} />);

    expect(
      await screen.findByText('Picks saved to your account')
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Select QB 2 as winner' })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole('button', { name: 'Select QB 1 as winner' })
    ).toHaveLength(1);
  });

  it('saves a pick to the account', async () => {
    render(<BackupQBBracket entrants={createEntrants(4)} preferredSize={4} />);
    fireEvent.click(pickButton('QB 1'));

    await waitFor(
      () =>
        expect(saveBracketPicks).toHaveBeenCalledWith([['qb-1', null], [null]]),
      { timeout: 2000 }
    );
    expect(
      await screen.findByText('Picks saved to your account')
    ).toBeInTheDocument();
  });

  it("uploads this browser's picks when the account has none", async () => {
    window.localStorage.setItem(
      BRACKET_STORAGE_KEY,
      JSON.stringify({ winners: [['qb-1', null], [null]] })
    );
    render(<BackupQBBracket entrants={createEntrants(4)} preferredSize={4} />);
    await waitFor(() =>
      expect(saveBracketPicks).toHaveBeenCalledWith([['qb-1', null], [null]])
    );
  });

  it('keeps picks on this device when the account cannot be reached', async () => {
    vi.mocked(fetchBracketPicks).mockRejectedValue(new Error('denied'));
    vi.mocked(saveBracketPicks).mockRejectedValue(new Error('denied'));
    render(<BackupQBBracket entrants={createEntrants(4)} preferredSize={4} />);
    fireEvent.click(pickButton('QB 1'));

    await waitFor(() => expect(saveBracketPicks).toHaveBeenCalled(), {
      timeout: 2000,
    });
    expect(screen.getByText('Picks saved on this device')).toBeInTheDocument();
    expect(window.localStorage.getItem(BRACKET_STORAGE_KEY)).toContain('qb-1');
  });
});
