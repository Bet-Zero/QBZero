import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { splitNameForTwoLines } from '@/utils/formatting/playerName';
import {
  summariseRankingChange,
  describeRankingChange,
} from '@/utils/rankings/rankingSummary';
import {
  toCsv,
  toPlainText,
  exportFilename,
} from '@/utils/rankings/rankingExportFormats';
import QBRankingCard from '@/features/rankings/QBRankingCard';

afterEach(cleanup);

describe('splitting a name across two lines', () => {
  it('keeps a suffix with the surname', () => {
    // "Jr." alone on the second line was the bug.
    expect(splitNameForTwoLines('Michael Penix Jr.')).toEqual({
      first: 'Michael',
      last: 'Penix Jr.',
    });
    expect(splitNameForTwoLines('Cam Ward III')).toEqual({
      first: 'Cam',
      last: 'Ward III',
    });
  });

  it('leaves an ordinary name alone', () => {
    expect(splitNameForTwoLines('Josh Allen')).toEqual({
      first: 'Josh',
      last: 'Allen',
    });
    expect(splitNameForTwoLines("Aidan O'Connell")).toEqual({
      first: 'Aidan',
      last: "O'Connell",
    });
  });

  it('handles a middle name, one word, and nothing at all', () => {
    expect(splitNameForTwoLines('Robert Griffin III')).toEqual({
      first: 'Robert',
      last: 'Griffin III',
    });
    expect(splitNameForTwoLines('Ndamukong')).toEqual({
      first: 'Ndamukong',
      last: '',
    });
    expect(splitNameForTwoLines('')).toEqual({ first: '', last: '' });
  });
});

describe('describing what changed in a snapshot', () => {
  const board = (...ids) => ids.map((id) => ({ id, name: id.toUpperCase() }));

  it('names the biggest riser and the biggest faller', () => {
    const summary = summariseRankingChange(
      board('c', 'a', 'd', 'b'),
      board('a', 'b', 'c', 'd')
    );
    expect(summary.riser).toEqual({ name: 'C', positions: 2 });
    expect(summary.faller).toEqual({ name: 'B', positions: 2 });
    expect(describeRankingChange(summary)).toContain('▲ C +2');
    expect(describeRankingChange(summary)).toContain('▼ B −2');
  });

  it('breaks a tie on final position, so the summary is stable', () => {
    // A and B both fall one place. A ends up higher, so A is the one named --
    // and it is named the same way on every recomputation.
    const summary = summariseRankingChange(
      board('c', 'a', 'b'),
      board('a', 'b', 'c')
    );
    expect(summary.faller).toEqual({ name: 'A', positions: 1 });
  });

  it('counts arrivals and departures', () => {
    const summary = summariseRankingChange(
      board('a', 'b', 'd'),
      board('a', 'b', 'c')
    );
    expect(summary.added).toBe(1);
    expect(summary.removed).toBe(1);
  });

  it('says so when a save changed nothing', () => {
    const summary = summariseRankingChange(board('a', 'b'), board('a', 'b'));
    expect(summary.unchanged).toBe(true);
    expect(describeRankingChange(summary)).toBe('No changes');
  });

  it('has nothing to say about the very first snapshot', () => {
    expect(summariseRankingChange(board('a'), undefined)).toBeNull();
    expect(describeRankingChange(null)).toBeNull();
  });
});

describe('text and spreadsheet exports', () => {
  const board = [
    { id: 'josh-allen', name: 'Josh Allen', team: 'buf', notes: 'Cannon' },
    { id: 'x', name: 'Comma Guy', team: 'KC', notes: 'Tough, but raw' },
  ];

  it('numbers a plain-text list from 1', () => {
    expect(toPlainText(board)).toBe('#1 Josh Allen (BUF)\n#2 Comma Guy (KC)');
  });

  it('carries notes into CSV, which an image cannot', () => {
    const csv = toCsv(board);
    expect(csv.split('\n')[0]).toBe('Rank,Name,Team,Notes');
    expect(csv).toContain('1,Josh Allen,BUF,Cannon');
  });

  it('quotes a field containing a comma so the columns survive', () => {
    expect(toCsv(board)).toContain('"Tough, but raw"');
  });

  it('builds a filename every OS accepts', () => {
    expect(exportFilename('My QB Rankings / 2026', 'csv')).toMatch(
      /^My-QB-Rankings-2026-\d{4}-\d{2}-\d{2}\.csv$/
    );
  });
});

describe('the notes draft on a ranking card', () => {
  const baseProps = {
    onMoveUp: () => {},
    onMoveDown: () => {},
    onRemove: () => {},
    canMoveUp: false,
    canMoveDown: false,
  };

  it('picks up a note changed elsewhere instead of holding a stale draft', () => {
    // The same card is reused when a different archive is selected, so a draft
    // seeded once and never refreshed showed the wrong QB's note.
    const { rerender } = render(
      <QBRankingCard
        qb={{ id: 'a', name: 'Alpha QB', team: 'BUF', rank: 1, notes: 'first' }}
        onEditNotes={() => {}}
        {...baseProps}
      />
    );

    rerender(
      <QBRankingCard
        qb={{
          id: 'a',
          name: 'Alpha QB',
          team: 'BUF',
          rank: 1,
          notes: 'second',
        }}
        onEditNotes={() => {}}
        {...baseProps}
      />
    );

    fireEvent.click(document.querySelector('button[title="Edit notes"]'));
    expect(document.querySelector('textarea').value).toBe('second');
  });

  it('does not overwrite what is being typed', () => {
    const onEditNotes = vi.fn();
    const qb = {
      id: 'a',
      name: 'Alpha QB',
      team: 'BUF',
      rank: 1,
      notes: 'saved',
    };
    const { rerender } = render(
      <QBRankingCard qb={qb} onEditNotes={onEditNotes} {...baseProps} />
    );

    fireEvent.click(document.querySelector('button[title="Edit notes"]'));
    fireEvent.change(document.querySelector('textarea'), {
      target: { value: 'half-typed thought' },
    });

    // An unrelated re-render must not wipe the draft.
    rerender(
      <QBRankingCard qb={qb} onEditNotes={onEditNotes} {...baseProps} />
    );
    expect(document.querySelector('textarea').value).toBe('half-typed thought');
  });
});

describe('archive cards', () => {
  it('splits a suffixed name without stranding the suffix', () => {
    render(
      <QBRankingCard
        qb={{ id: 'p', name: 'Michael Penix Jr.', team: 'ATL', rank: 4 }}
        readOnly
        isArchiveMode
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        onRemove={() => {}}
        onEditNotes={() => {}}
        canMoveUp={false}
        canMoveDown={false}
      />
    );

    expect(screen.getByText('Michael')).toBeTruthy();
    expect(screen.getByText('Penix Jr.')).toBeTruthy();
    expect(screen.queryByText('Jr.')).toBeNull();
  });
});
