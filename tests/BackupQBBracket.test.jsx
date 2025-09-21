import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import BackupQBBracket from '@/features/backupBracket/BackupQBBracket.jsx';

const createEntrants = (count) =>
  Array.from({ length: count }, (_, index) => ({
    id: `qb-${index + 1}`,
    display_name: `QB ${index + 1}`,
    team: `T${index + 1}`,
  }));

describe('BackupQBBracket component', () => {
  it('allows selecting and clearing winners', async () => {
    render(<BackupQBBracket entrants={createEntrants(16)} preferredSize={16} />);

    expect(await screen.findByText('Winner of Round of 16 • Match 1')).toBeInTheDocument();

    const allButtons = screen.getAllByRole('button', { name: /Select QB/i });
    const qb1Button = allButtons.find((button) => button.getAttribute('aria-label')?.includes('QB 1'));
    const qb8Button = allButtons.find((button) => button.getAttribute('aria-label')?.includes('QB 8'));

    expect(qb1Button).toBeTruthy();
    expect(qb8Button).toBeTruthy();

    fireEvent.click(qb1Button);
    fireEvent.click(qb8Button);

    expect(screen.queryByText('Winner of Round of 16 • Match 1')).not.toBeInTheDocument();
    expect(screen.getAllByText('Advanced').length).toBeGreaterThan(0);

    fireEvent.click(qb1Button);
    expect(await screen.findByText('Winner of Round of 16 • Match 1')).toBeInTheDocument();
  });
});
