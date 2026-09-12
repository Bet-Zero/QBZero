import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withRanks,
  appendToRanking,
  resolveRankingEntries,
  isManualEntryId,
} from '@/utils/rankings/personalRankingEntries.js';

// ---------------------------------------------------------------------------
// The entry helpers, in isolation.
// ---------------------------------------------------------------------------

describe('personal ranking entries', () => {
  it('numbers a board from 1 in array order', () => {
    const ranked = withRanks([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    expect(ranked.map((q) => q.rank)).toEqual([1, 2, 3]);
  });

  it('numbers every addition when several arrive at once', () => {
    // The bug this guards: ranks were computed from a state value that could
    // not advance inside a synchronous loop, so "Add All" gave every
    // quarterback the same number.
    const board = appendToRanking(
      [],
      [
        { id: 'josh-allen', name: 'Josh Allen' },
        { id: 'lamar-jackson', name: 'Lamar Jackson' },
        { id: 'joe-burrow', name: 'Joe Burrow' },
      ]
    );
    expect(board.map((q) => q.rank)).toEqual([1, 2, 3]);
  });

  it('keeps the roster id and invents one only for a manual entry', () => {
    const [rosterPick, manual] = appendToRanking(
      [],
      [{ id: 'josh-allen', name: 'Josh Allen' }, { name: 'Some Practice Squad QB' }]
    );
    expect(rosterPick.id).toBe('josh-allen');
    expect(isManualEntryId(rosterPick.id)).toBe(false);
    expect(isManualEntryId(manual.id)).toBe(true);
  });

  it('resolves a stale team from the roster without touching the rest', () => {
    const entries = [
      { id: 'aaron-rodgers', name: 'Aaron Rodgers', team: 'NYJ', notes: 'keep me' },
      { id: 'manual-1', name: 'Nobody', team: 'FA' },
    ];
    const resolved = resolveRankingEntries(entries, [
      { id: 'aaron-rodgers', name: 'Aaron Rodgers', team: 'PIT' },
    ]);
    expect(resolved[0].team).toBe('PIT');
    expect(resolved[0].notes).toBe('keep me');
    expect(resolved[1]).toBe(entries[1]);
  });

  it('leaves an archived board alone when no roster is supplied', () => {
    const archived = [{ id: 'aaron-rodgers', team: 'NYJ' }];
    expect(resolveRankingEntries(archived, [])).toBe(archived);
  });
});

// ---------------------------------------------------------------------------
// The editor page, where the two silent writers lived.
// ---------------------------------------------------------------------------

const helpers = vi.hoisted(() => ({
  getCurrentPersonalRanking: vi.fn(),
  saveCurrentPersonalRankings: vi.fn(async () => ({ currentId: 'c', archiveId: 'a' })),
  savePersonalRankingNotes: vi.fn(async () => 'saved'),
  getPreviousPersonalRanking: vi.fn(async () => null),
}));

vi.mock('@/firebase/personalRankingHelpers', () => helpers);
vi.mock('@/firebase/listHelpers', () => ({
  fetchQBRanking: vi.fn(),
  saveQBRanking: vi.fn(),
  createQBRanking: vi.fn(),
}));

const roster = [
  { id: 'josh-allen', name: 'Josh Allen', team: 'BUF', status: 'active' },
  { id: 'lamar-jackson', name: 'Lamar Jackson', team: 'BAL', status: 'active' },
  { id: 'aaron-rodgers', name: 'Aaron Rodgers', team: 'PIT', status: 'retired' },
];

vi.mock('@/hooks/useQBRoster', () => ({
  default: () => ({
    roster,
    activeRoster: roster.filter((q) => q.status === 'active'),
    loading: false,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  const navigate = vi.fn();
  return { ...actual, useParams: () => ({}), useNavigate: () => navigate };
});

const QBRankingsPage = (await import('@/pages/QBRankingsPage.jsx')).default;
const { MemoryRouter } = await import('react-router-dom');

const renderEditor = () =>
  render(
    <MemoryRouter>
      <QBRankingsPage />
    </MemoryRouter>
  );

const renderedRanks = () =>
  Array.from(document.querySelectorAll('div'))
    .filter((d) => /^\d+$/.test(d.textContent) && d.className.includes('font-black'))
    .map((d) => d.textContent);

beforeEach(() => {
  vi.clearAllMocks();
  helpers.getCurrentPersonalRanking.mockResolvedValue({ id: 'current', rankings: [] });
  helpers.savePersonalRankingNotes.mockResolvedValue('saved');
  helpers.getPreviousPersonalRanking.mockResolvedValue(null);
});
afterEach(cleanup);

describe('Personal rankings editor', () => {
  it('numbers every quarterback added by Add All', async () => {
    renderEditor();
    await waitFor(() => screen.getByText(/No QBs ranked yet/));
    fireEvent.click(screen.getByText('Add Your First QB'));
    fireEvent.click(await screen.findByText(/Add All/));

    await waitFor(() => expect(renderedRanks().length).toBeGreaterThan(1));
    expect(renderedRanks()).toEqual(['1', '2']); // the two active QBs
  });

  it('excludes retired quarterbacks from Add All but leaves them addable', async () => {
    renderEditor();
    await waitFor(() => screen.getByText(/No QBs ranked yet/));
    fireEvent.click(screen.getByText('Add Your First QB'));

    // Add All counts the active roster only...
    expect(await screen.findByText(/Add All \(2\)/)).toBeTruthy();
    // ...but the retired quarterback is still listed, and marked as such.
    expect(screen.getByText('Aaron Rodgers')).toBeTruthy();
    expect(screen.getAllByText(/Retired/).length).toBeGreaterThan(0);
  });

  it('stores the roster id, not a generated one', async () => {
    renderEditor();
    await waitFor(() => screen.getByText(/No QBs ranked yet/));
    fireEvent.click(screen.getByText('Add Your First QB'));
    fireEvent.click(await screen.findByText('Josh Allen'));

    // Close the modal, then save and inspect what was written.
    fireEvent.click(document.querySelector('button[title="Close"]'));
    fireEvent.click(await screen.findByText('Save'));

    await waitFor(() => expect(helpers.saveCurrentPersonalRankings).toHaveBeenCalled());
    const [written] = helpers.saveCurrentPersonalRankings.mock.calls[0];
    expect(written[0].id).toBe('josh-allen');
  });

  it('does not commit an unsaved reorder when a note is edited', async () => {
    helpers.getCurrentPersonalRanking.mockResolvedValue({
      id: 'current',
      rankings: [
        { id: 'josh-allen', name: 'Josh Allen', team: 'BUF', rank: 1, notes: '' },
        { id: 'lamar-jackson', name: 'Lamar Jackson', team: 'BAL', rank: 2, notes: '' },
      ],
    });
    renderEditor();
    await waitFor(() => screen.getByText('Josh Allen'));

    // Move the second QB up, leaving the board dirty.
    fireEvent.click(document.querySelectorAll('button[title="Move up"]')[1]);
    await waitFor(() =>
      expect(document.body.textContent).toContain('unsaved changes')
    );

    // Now edit a note on the QB that is currently on top.
    fireEvent.click(document.querySelectorAll('button[title="Edit notes"]')[0]);
    const textarea = document.querySelector('textarea');
    fireEvent.change(textarea, { target: { value: 'best arm in the league' } });
    const notesSave = Array.from(
      textarea.closest('div').parentElement.querySelectorAll('button')
    ).find((b) => b.textContent === 'Save');
    fireEvent.click(notesSave);

    // The note is written on its own, addressed by id...
    await waitFor(() =>
      expect(helpers.savePersonalRankingNotes).toHaveBeenCalledWith(
        'lamar-jackson',
        'best arm in the league'
      )
    );
    // ...and the unsaved reorder is still unsaved.
    expect(helpers.saveCurrentPersonalRankings).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('unsaved changes');
  });
});
