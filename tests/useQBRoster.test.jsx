import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { quarterbacks } from '@/features/ranker/quarterbacks';

const players = [
  // Aaron Rodgers is listed as PIT in quarterbacks.js; pretend he moved.
  { id: 'aaron-rodgers', bio: { Team: 'NYJ' }, status: 'retired' },
  { id: 'josh-allen', bio: { Team: 'BUF' }, status: 'active' },
];

vi.mock('@/hooks/usePlayerData', () => ({
  default: () => ({ players, loading: false }),
}));

const useQBRoster = (await import('@/hooks/useQBRoster')).default;

describe('useQBRoster', () => {
  it('prefers the saved team over the seed value', () => {
    // AddQBModal and the takes picker read qb.team straight off the curated
    // list, so a quarterback who changed teams kept showing the old one long
    // after the record was corrected.
    const { result } = renderHook(() => useQBRoster());
    const rodgers = result.current.roster.find((q) => q.id === 'aaron-rodgers');

    expect(rodgers.team).toBe('NYJ');
  });

  it('falls back to the seed team when there is no record yet', () => {
    const { result } = renderHook(() => useQBRoster());
    const seeded = quarterbacks.find(
      (q) => !players.some((p) => p.id === q.id)
    );
    const resolved = result.current.roster.find((q) => q.id === seeded.id);

    expect(resolved.team).toBe(seeded.team);
  });

  it('keeps retired quarterbacks in the full roster', () => {
    const { result } = renderHook(() => useQBRoster());

    expect(result.current.roster).toHaveLength(quarterbacks.length);
    expect(
      result.current.roster.find((q) => q.id === 'aaron-rodgers').status
    ).toBe('retired');
  });

  it('leaves them out of the active roster', () => {
    const { result } = renderHook(() => useQBRoster());
    const ids = result.current.activeRoster.map((q) => q.id);

    expect(ids).not.toContain('aaron-rodgers');
    expect(ids).toContain('josh-allen');
  });

  it('treats a quarterback with no recorded status as active', () => {
    const { result } = renderHook(() => useQBRoster());
    const unrecorded = quarterbacks.find(
      (q) => !players.some((p) => p.id === q.id)
    );

    expect(
      result.current.activeRoster.some((q) => q.id === unrecorded.id)
    ).toBe(true);
  });
});
