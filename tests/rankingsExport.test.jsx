import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QBRankingsExport from '@/features/rankings/QBRankingsExport.jsx';
import {
  getLogoPath,
  getHeadshotSrc,
  createColumns,
} from '@/utils/rankingExportHelpers.js';

// Shape produced by QBRankingsPage for Personal QB Rankings: a flat array of
// QB objects carrying their own `rank`, not { qb, rank } wrappers.
const personalRankings = [
  { id: 'josh-allen', name: 'Josh Allen', team: 'BUF', rank: 1 },
  { id: 'lamar-jackson', name: 'Lamar Jackson', team: 'BAL', rank: 2 },
  { id: 'geno-smith', name: 'Geno Smith', team: 'LV', rank: 3 },
];

describe('Personal QB Rankings export path', () => {
  it('renders every QB through the shared export modal', () => {
    render(
      <QBRankingsExport
        rankings={personalRankings}
        rankingName="My QB Rankings"
        onClose={vi.fn()}
      />
    );

    // The modal renders a visible view plus a hidden export view, so each
    // player legitimately appears more than once.
    personalRankings.forEach((qb) => {
      expect(screen.getAllByText(qb.name).length).toBeGreaterThan(0);
    });
  });

  it('keeps the caller-supplied order and numbers ranks from 1', () => {
    render(
      <QBRankingsExport
        rankings={personalRankings}
        rankingName="My QB Rankings"
        onClose={vi.fn()}
      />
    );

    // Ranks are derived from array position, so the caller's order must survive.
    const text = document.body.textContent;
    expect(text.indexOf('Josh Allen')).toBeLessThan(text.indexOf('Lamar Jackson'));
    expect(text.indexOf('Lamar Jackson')).toBeLessThan(text.indexOf('Geno Smith'));

    // Rank badges 1..3 are rendered for a 3-QB ranking.
    ['1', '2', '3'].forEach((rank) => {
      expect(within(document.body).getAllByText(rank).length).toBeGreaterThan(0);
    });
  });

  it('resolves logos and headshots for personal-ranking QB objects', () => {
    expect(getLogoPath('BUF')).toBe('/assets/logos/bills.svg');
    expect(getLogoPath('LV')).toBe('/assets/logos/raiders.svg');
    expect(getLogoPath(undefined)).toBeNull();
    expect(getHeadshotSrc(personalRankings[0])).toBe(
      '/assets/headshots/josh-allen.png'
    );
    expect(getHeadshotSrc({ headshotUrl: 'https://cdn/x.png' })).toBe(
      'https://cdn/x.png'
    );
  });

  it('columnises both flat players and { qb } wrappers identically', () => {
    const flat = createColumns(personalRankings, 2);
    const wrapped = createColumns(
      personalRankings.map((qb) => ({ qb })),
      2
    );
    expect(flat.flat().map((c) => c.player.id)).toEqual([
      'josh-allen',
      'lamar-jackson',
      'geno-smith',
    ]);
    expect(wrapped.flat().map((c) => c.player.id)).toEqual(
      flat.flat().map((c) => c.player.id)
    );
    expect(flat.flat().map((c) => c.rank)).toEqual([1, 2, 3]);
  });
});
