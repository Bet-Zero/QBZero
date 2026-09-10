import { render, within, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import ComparisonMatrix from '@/features/ranker/ComparisonMatrix.jsx';

afterEach(cleanup);

const players = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Beta' },
];

describe('ComparisonMatrix', () => {
  it('renders results for players in the table', () => {
    const { container } = render(
      <ComparisonMatrix
        players={players}
        comparisons={[{ winner: 'a', loser: 'b' }]}
      />
    );
    expect(within(container).getByText('✅')).toBeTruthy();
    expect(within(container).getByText('❌')).toBeTruthy();
  });

  it('ignores comparisons naming players outside the table', () => {
    // Indexing comparisonMap['ghost'] threw a TypeError and blanked the page.
    expect(() =>
      render(
        <ComparisonMatrix
          players={players}
          comparisons={[
            { winner: 'ghost', loser: 'a' },
            { winner: 'b', loser: 'phantom' },
            { winner: 'a', loser: 'b' },
          ]}
        />
      )
    ).not.toThrow();
  });
});
